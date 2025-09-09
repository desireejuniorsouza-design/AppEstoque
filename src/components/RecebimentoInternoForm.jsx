import { useState } from 'react';
//import { supabase } from "../supabaseClient";
import QRCode from 'react-qr-code';
import { v4 as uuidv4 } from 'uuid';
import './RecebimentoInternoForm.css';
import './Etiquetas.css';


// Estado inicial para um único lote
const initialLoteState = () => ({
    id: Date.now(),
    especie: '',
    categoria: '',
    hibrido: '',
    peneira: '',
    lote: '',
    safra: '',
    peso: '',
    produtor: '',
    unidadeProdutora: '',
    validade: '',
    tratamento: '',
    sacaria: '',
    quantidadeLastro: '',
    quantidadePalete: '',
    formulaCalculo: '',
    totalLote: '',
    localArmazenado: '',
});

// Função para calcular o total do lote a partir da fórmula
const calculateTotalLote = (formula) => {
    if (!formula) return '';
    const cleanFormula = formula.replace(/x/g, '*');
    try {
        const result = Function(`"use strict"; return (${cleanFormula})`)();
        return isNaN(result) ? 'Erro na fórmula' : result;
    } catch {
        return 'Erro na fórmula';
    }
};

const sanitize = (value) => value ?? '';

export default function RecebimentoInternoForm() {
    const [lotes, setLotes] = useState([initialLoteState()]);
    const [qrCodeValues, setQrCodeValues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const showMessage = (text, type = 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    const handleLoteChange = (index, e) => {
        const { name, value } = e.target;
        const newLotes = [...lotes];
        const updatedLote = { ...newLotes[index] };

        if (name === 'peso') {
            updatedLote[name] = value.replace(',', '.');
        } else if (name === 'formulaCalculo') {
            updatedLote[name] = value;
            updatedLote.totalLote = calculateTotalLote(value);
        } else {
            updatedLote[name] = value;
        }

        newLotes[index] = updatedLote;
        setLotes(newLotes);
    };

    const handleAddLote = () => setLotes([...lotes, initialLoteState()]);
    const handleRemoveLote = (index) => setLotes(lotes.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setQrCodeValues([]);
        setMessage({ text: '', type: '' });

        try {
            const response = await fetch('http://localhost:3001/api/recebimento-interno', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lotes })
            });


            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro desconhecido ao registrar o recebimento.');
            }

            setQrCodeValues(result.estoqueData);
            showMessage('Recebimento(s) interno(s) registrado(s) com sucesso!', 'success');
            setLotes([initialLoteState()]);
        } catch (error) {
            console.error('Erro ao processar o formulário:', error);
            showMessage('Erro ao registrar recebimento. Verifique os dados e tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Função auxiliar para agrupar os QR codes por lote
    const groupQrCodesByLote = (qrCodes) => {
        const groups = {};
        qrCodes.forEach(item => {
            const loteKey = item.lote;
            if (!groups[loteKey]) {
                groups[loteKey] = [];
            }
            groups[loteKey].push(item);
        });
        return groups;
    };

    const groupedQrCodes = groupQrCodesByLote(qrCodeValues);

    return (
        <div className="recebimento-interno-container">
            <div className="recebimento-interno-card">
                <h1 className="recebimento-interno-title">Recebimento Interno 📦</h1>

                {message.text && (
                    <div className={`recebimento-interno-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="recebimento-interno-form">
                    {lotes.map((lote, index) => (
                        <div key={lote.id} className="lote-section">
                            <h3 className="lote-title">Lote {index + 1} 🌱</h3>
                            <div className="input-grid">
                                <input name="unidadeProdutora" value={sanitize(lote.unidadeProdutora)} onChange={(e) => handleLoteChange(index, e)} placeholder="Nome da Unidade Produtora" required className="input-field" />
                                <input name="especie" value={sanitize(lote.especie)} onChange={(e) => handleLoteChange(index, e)} placeholder="Espécie" required className="input-field" />
                                <input name="categoria" value={sanitize(lote.categoria)} onChange={(e) => handleLoteChange(index, e)} placeholder="Categoria" className="input-field" />
                                <input name="hibrido" value={sanitize(lote.hibrido)} onChange={(e) => handleLoteChange(index, e)} placeholder="Híbrido" className="input-field" />
                                <input name="peneira" value={sanitize(lote.peneira)} onChange={(e) => handleLoteChange(index, e)} placeholder="Peneira" className="input-field" />
                                <input name="lote" value={sanitize(lote.lote)} onChange={(e) => handleLoteChange(index, e)} placeholder="Lote" className="input-field" />
                                <input name="safra" value={sanitize(lote.safra)} onChange={(e) => handleLoteChange(index, e)} placeholder="Safra" className="input-field" />
                                <input name="peso" type="text" value={sanitize(lote.peso)} onChange={(e) => handleLoteChange(index, e)} placeholder="Peso (ex: 20,50)" required className="input-field" />
                                <input name="produtor" value={sanitize(lote.produtor)} onChange={(e) => handleLoteChange(index, e)} placeholder="Produtor" required className="input-field" />
                                <input name="validade" type="text" value={sanitize(lote.validade)} onChange={(e) => handleLoteChange(index, e)} placeholder="Validade (ex: MM/AA)" className="input-field" />
                                <input name="tratamento" value={sanitize(lote.tratamento)} onChange={(e) => handleLoteChange(index, e)} placeholder="Tratamento" className="input-field" />
                                <input name="sacaria" value={sanitize(lote.sacaria)} onChange={(e) => handleLoteChange(index, e)} placeholder="Sacaria" className="input-field" />
                                <input name="quantidadeLastro" type="number" value={sanitize(lote.quantidadeLastro)} onChange={(e) => handleLoteChange(index, e)} placeholder="Quantidade Lastro" className="input-field" />
                                <input name="quantidadePalete" type="number" value={sanitize(lote.quantidadePalete)} onChange={(e) => handleLoteChange(index, e)} placeholder="Quantidade Palete" className="input-field" />
                                <input name="formulaCalculo" type="text" value={sanitize(lote.formulaCalculo)} onChange={(e) => handleLoteChange(index, e)} placeholder="Fórmula de Cálculo (ex: 10*60+5)" className="input-field" />
                                <input name="totalLote" type="text" value={sanitize(lote.totalLote)} placeholder="Total do Lote" readOnly className="input-field-disabled" />
                                <input name="localArmazenado" value={sanitize(lote.localArmazenado)} onChange={(e) => handleLoteChange(index, e)} placeholder="Local Armazenado" className="input-field" />
                            </div>
                            {lotes.length > 1 && (
                                <button type="button" onClick={() => handleRemoveLote(index)} className="remove-lote-button">
                                    Remover Lote
                                </button>
                            )}
                        </div>
                    ))}

                    <div className="button-group">
                        <button type="button" onClick={handleAddLote} className="add-lote-button">
                            + Adicionar Lote
                        </button>
                        <button type="submit" disabled={loading} className="submit-button">
                            {loading ? 'Processando...' : 'Gerar QR Code(s)'}
                        </button>
                    </div>
                </form>

                {Object.keys(groupedQrCodes).length > 0 && (
                    <div className="qr-codes-container">
                        <button className="print-button" onClick={() => window.print()}>
                            Imprimir Etiquetas 🖨️
                        </button>
                        
                        {Object.entries(groupedQrCodes).map(([loteId, items]) => (
                            <div key={loteId}>
                                <h1>Etiquetas do Lote: {loteId}</h1>
                                <div className="qr-codes-grid">
                                    {items.map((item, index) => (
                                        <div key={item.id} className="qr-code-item">
                                            <div className="qr-code-info">
                                                <h3>Palete {index + 1}</h3>
                                                <p><strong>ID:</strong> {item.id}</p>
                                                <p><strong>Espécie:</strong> {item.especie}</p>
                                                <p><strong>Lote:</strong> {item.lote}</p>
                                                <p><strong>Trat:</strong> {item.tratamento}</p>
                                                <p><strong>Sacos no Palete:</strong> {item.quantidade_palete}</p>
                                                <p><strong>Total do Lote:</strong> {item.total_lote}</p>
                                                <p><strong>Posição Atual:</strong> {item.local_armazenado}</p>
                                            </div>
                                            <div className="qr-code-image">
                                                <QRCode value={item.id} size={180} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}