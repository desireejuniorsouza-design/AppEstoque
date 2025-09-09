// backend/server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Verificação das chaves do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use a chave de serviço
if (!supabaseUrl || !supabaseKey) {
    console.error('Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_KEY não estão definidas.');
    process.exit(1); // Encerra o servidor se as chaves não estiverem configuradas
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// Endpoint para o recebimento externo
app.post('/api/recebimento', async (req, res) => {
    const { formData, lotes } = req.body;

    // Adicione uma validação inicial para garantir que os dados existem
    if (!formData || !lotes || !Array.isArray(lotes)) {
        return res.status(400).json({ error: 'Dados de recebimento inválidos.' });
    }

    const calculateTotalLote = (formula) => {
        if (!formula) return 0;
        const cleanFormula = formula.replace(/x/g, '*');
        try {
            const result = Function(`"use strict"; return (${cleanFormula})`)();
            return isNaN(result) ? 0 : result;
        } catch {
            return 0;
        }
    };

    try {
        // Insere os dados do transporte
        const { data: recebimentoData, error: recebimentoError } = await supabase
            .from('recebimentos_externos')
            .insert({
                cliente: formData.cliente,
                nome_transportadora: formData.nomeTransportadora,
                motorista: formData.motorista,
                placa: formData.placa,
                origem: formData.origem,
                total_paletes: formData.totalPaletes,
            })
            .select();

        if (recebimentoError) {
            console.error('Erro ao inserir recebimento:', recebimentoError);
            return res.status(500).json({ error: 'Erro ao registrar recebimento.' });
        }

        const recebimentoId = recebimentoData[0].id;
        const allInserts = [];

        for (const lote of lotes) {
            // Validação de dados de cada lote para evitar erros
            if (!lote.formulaCalculo || !lote.especie || !lote.lote) {
                console.error('Lote com dados ausentes:', lote);
                continue; // Pula este lote e continua com os próximos
            }

            const totalSacos = calculateTotalLote(lote.formulaCalculo);
            let paleteQuantities = [];
            const parts = lote.formulaCalculo.split('+').map(part => part.trim());

            for (const part of parts) {
                if (part.includes('*')) {
                    const [numPaletesStr, sacosPorPaleteStr] = part.split('*').map(s => s.trim());
                    const numPaletes = parseInt(numPaletesStr);
                    const sacosPorPalete = parseInt(sacosPorPaleteStr);
                    if (!isNaN(numPaletes) && !isNaN(sacosPorPalete)) {
                        for (let i = 0; i < numPaletes; i++) {
                            paleteQuantities.push(sacosPorPalete);
                        }
                    }
                } else {
                    const sacos = parseInt(part);
                    if (!isNaN(sacos)) {
                        paleteQuantities.push(sacos);
                    }
                }
            }

            for (const quantidade of paleteQuantities) {
                allInserts.push({
                    origem: 'externo',
                    recebimento_externo_id: recebimentoId,
                    especie: lote.especie,
                    categoria: lote.categoria,
                    hibrido: lote.hibrido,
                    peneira: lote.peneira,
                    lote: lote.lote,
                    safra: lote.safra,
                    // Use o operador || para garantir que o valor seja um número
                    peso: parseFloat(lote.peso) || 0,
                    produtor: lote.produtor,
                    validade: lote.validade,
                    tratamento: lote.tratamento,
                    sacaria: lote.sacaria,
                    quantidade_lastro: parseInt(lote.quantidadeLastro) || 0,
                    quantidade_palete: quantidade,
                    total_lote: totalSacos,
                    local_armazenado: lote.localArmazenado,
                });
            }
        }

        const { data: estoqueData, error: estoqueError } = await supabase
            .from('estoque_geral')
            .insert(allInserts)
            .select();

        if (estoqueError) {
            console.error('Erro ao inserir estoque:', estoqueError);
            return res.status(500).json({ error: 'Erro ao registrar estoque.', details: estoqueError.message });
        }
        
        res.status(201).json({ estoqueData });

    } catch (error) {
        console.error('Erro no backend:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}); 

// Novo endpoint para o recebimento interno
app.post('/api/recebimento-interno', async (req, res) => {
    const { lotes } = req.body;
    
    // Adicione uma validação inicial para garantir que os lotes existem
    if (!lotes || !Array.isArray(lotes)) {
        return res.status(400).json({ error: 'Dados de lote inválidos.' });
    }

    const calculateTotalLote = (formula) => {
        if (!formula) return 0;
        const cleanFormula = formula.replace(/x/g, '*');
        try {
            const result = Function(`"use strict"; return (${cleanFormula})`)();
            return isNaN(result) ? 0 : result;
        } catch {
            return 0;
        }
    };

    try {
        const allInserts = [];
        for (const lote of lotes) {
            // Validação de dados de cada lote para evitar erros
            if (!lote.formulaCalculo || !lote.especie || !lote.lote) {
                console.error('Lote com dados ausentes:', lote);
                continue;
            }

            const totalSacos = calculateTotalLote(lote.formulaCalculo);
            let paleteQuantities = [];
            const formula = lote.formulaCalculo;
            
            const parts = formula.split('+').map(part => part.trim());

            for (const part of parts) {
                if (part.includes('*')) {
                    const [numPaletesStr, sacosPorPaleteStr] = part.split('*').map(s => s.trim());
                    const numPaletes = parseInt(numPaletesStr);
                    const sacosPorPalete = parseInt(sacosPorPaleteStr);
                    if (!isNaN(numPaletes) && !isNaN(sacosPorPalete)) {
                        for (let i = 0; i < numPaletes; i++) {
                            paleteQuantities.push(sacosPorPalete);
                        }
                    }
                } else {
                    const sacos = parseInt(part);
                    if (!isNaN(sacos)) {
                        paleteQuantities.push(sacos);
                    }
                }
            }

            const lastro = parseInt(lote.quantidadeLastro) || 0;
            if (paleteQuantities.length === 0 && lastro > 0) {
                paleteQuantities.push(lastro);
            }

            for (const quantidade of paleteQuantities) {
                allInserts.push({
                    origem: 'interno',
                    especie: lote.especie,
                    categoria: lote.categoria,
                    hibrido: lote.hibrido,
                    peneira: lote.peneira,
                    lote: lote.lote,
                    safra: lote.safra,
                    peso: parseFloat(lote.peso) || 0,
                    produtor: lote.produtor,
                    unidade_produtora: lote.unidadeProdutora,
                    validade: lote.validade,
                    tratamento: lote.tratamento,
                    sacaria: lote.sacaria,
                    quantidade_lastro: lastro,
                    quantidade_palete: quantidade,
                    total_lote: totalSacos,
                    local_armazenado: lote.localArmazenado,
                });
            }
        }
        
        const { data, error } = await supabase
            .from('estoque_geral')
            .insert(allInserts)
            .select();

        if (error) {
            console.error('Erro ao inserir estoque:', error);
            return res.status(500).json({ error: 'Erro ao registrar recebimento interno.', details: error.message });
        }
        
        res.status(201).json({ estoqueData: data });

    } catch (error) {
        console.error('Erro ao processar o formulário de recebimento interno:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Endpoint Estoque
app.get('/api/estoque', async (req, res) => {
    const { searchTerm, sortBy, sortDirection } = req.query;

    let query = supabase.from('estoque_geral').select('*');

    if (searchTerm && searchTerm.trim() !== '') {
        query = query.or(`lote.ilike.%${searchTerm}%,produtor.ilike.%${searchTerm}%,especie.ilike.%${searchTerm}%`);
    }

    if (sortBy) {
        query = query.order(sortBy, { ascending: sortDirection === 'asc' });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    try {
        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar dados do estoque:', error);
            return res.status(500).json({ error: 'Erro ao buscar dados do estoque.', details: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Erro no backend:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Endpoint para excluir um registro
app.delete('/api/estoque/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('estoque_geral')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao excluir registro:', error);
            return res.status(500).json({ error: 'Erro ao excluir o registro.', details: error.message });
        }

        res.status(200).json({ message: 'Registro excluído com sucesso.' });
    } catch (error) {
        console.error('Erro no backend:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Endpoint para atualizar um registro (PUT)
app.put('/api/estoque/:id', async (req, res) => {
    const { id } = req.params;
    const updateData = req.body; 
    
    delete updateData.id; 

    try {
        const { data, error } = await supabase
            .from('estoque_geral')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Erro ao atualizar registro:', error);
            return res.status(400).json({ error: 'Erro ao atualizar o registro.', details: error.message });
        }

        if (data && data.length > 0) {
            res.status(200).json(data[0]);
        } else {
            res.status(404).json({ error: 'Registro não encontrado para atualização.' });
        }
    } catch (error) {
        console.error('Erro no backend:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor Express rodando em http://localhost:${port}`);
});