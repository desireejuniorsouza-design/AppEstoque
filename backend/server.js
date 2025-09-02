// backend/server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// As credenciais do Supabase ficarão em um arquivo .env,
// garantindo que não sejam expostas. Use a 'service role key' aqui.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors()); // Permite que o React (no localhost:3000) acesse esta API
app.use(express.json());

// Endpoint para o recebimento externo A sua lógica de negócio complexa, que estava no React, agora vive aqui.
app.post('/api/recebimento', async (req, res) => {
    const { formData, lotes } = req.body;

    // Função auxiliar para calcular o total do lote.
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
        // Insere os dados do transporte na tabela 'recebimentos_externos'.
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

        // Processa cada lote e prepara os dados para inserção.
        for (const lote of lotes) {
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

            // Cria um registro para cada palete com base na quantidade calculada.
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
                    peso: parseFloat(lote.peso),
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

        // Insere todos os paletes na tabela 'estoque_geral'.
        const { data: estoqueData, error: estoqueError } = await supabase
            .from('estoque_geral')
            .insert(allInserts)
            .select();

        if (estoqueError) {
            console.error('Erro ao inserir estoque:', estoqueError);
            return res.status(500).json({ error: 'Erro ao registrar estoque.' });
        }
        
        // Retorna os dados inseridos (com os IDs) para que o React gere os QR Codes.
        res.status(201).json({ estoqueData });

    } catch (error) {
        console.error('Erro no backend:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}); 

// Novo endpoint para o recebimento interno
app.post('/api/recebimento-interno', async (req, res) => {
    const { lotes } = req.body;

    // Função para calcular o total do lote, reutilizada
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
            const totalSacos = calculateTotalLote(lote.formulaCalculo);
            let paleteQuantities = [];
            const formula = lote.formulaCalculo;
            
            // Lógica para analisar a fórmula, movida do frontend para o backend
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

            // Agora, cria os objetos de inserção com base nas quantidades calculadas
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

        if (error) throw error;
        
        res.status(201).json({ estoqueData: data });

    } catch (error) {
        console.error('Erro ao processar o formulário de recebimento interno:', error);
        res.status(500).json({ error: 'Erro ao registrar recebimento interno.' });
    }
});

// Endpoint Estoque

app.get('/api/estoque', async (req, res) => {
    // Parâmetros de busca e ordenação enviados pelo frontend
    const { searchTerm, sortBy, sortDirection } = req.query;

    let query = supabase.from('estoque_geral').select('*');

    // Lógica para filtrar a busca (se o searchTerm for fornecido)
    if (searchTerm && searchTerm.trim() !== '') {
    query = query.or(`lote.ilike.%${searchTerm}%,produtor.ilike.%${searchTerm}%,especie.ilike.%${searchTerm}%`);
}


    // Lógica para ordenar os resultados (se sortBy for fornecido)
    if (sortBy) {
        query = query.order(sortBy, { ascending: sortDirection === 'asc' });
    } else {
        // Ordenação padrão (por exemplo, por data de criação)
        query = query.order('created_at', { ascending: false });
    }

    try {
        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar dados do estoque:', error);
            return res.status(500).json({ error: 'Erro ao buscar dados do estoque.' });
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
            return res.status(500).json({ error: 'Erro ao excluir o registro.' });
        }

        res.status(200).json({ message: 'Registro excluído com sucesso.' });
    } catch (error) {
        console.error('Erro no backend:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});
// Novo Endpoint para atualizar um registro (PUT)
app.put('/api/estoque/:id', async (req, res) => {
    const { id } = req.params;
    const updateData = req.body; // Dados do registro a serem atualizados
    
    try {
        const { data, error } = await supabase
            .from('estoque_geral')
            .update(updateData)
            .eq('id', id)
            .select(); // Adicione .select() para retornar o registro atualizado

        if (error) {
            console.error('Erro ao atualizar registro:', error);
            return res.status(500).json({ error: 'Erro ao atualizar o registro.' });
        }

        // Verifica se o registro foi encontrado e atualizado
        if (data && data.length > 0) {
            res.status(200).json(data[0]); // Retorna o registro atualizado
        } else {
            res.status(404).json({ error: 'Registro não encontrado.' });
        }
        
    } catch (error) {
        console.error('Erro no backend:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor Express rodando em http://localhost:${port}`);
});
