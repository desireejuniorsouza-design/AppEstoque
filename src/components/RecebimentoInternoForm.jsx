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

    return (
        <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center font-sans overflow-y-auto">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-8">
                <h1 className="text-3xl font-bold text-gray-800 text-center">Recebimento Interno 📦</h1>

                {message.text && (
                    <div className={`p-4 rounded-lg font-medium text-center transition-all duration-300
            ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' : ''}
            ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : ''}
            ${message.type === 'info' ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
          `}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {lotes.map((lote, index) => (
                        <div key={lote.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm lote-section">
                            <h3 className="text-xl font-semibold text-gray-700 mb-4">Lote {index + 1} 🌱</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input name="unidadeProdutora" value={lote.unidadeProdutora ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Nome da Unidade Produtora" required className="input-field" />
                                <input name="especie" value={lote.especie ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Espécie" required className="input-field" />
                                <input name="categoria" value={lote.categoria ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Categoria" className="input-field" />
                                <input name="hibrido" value={lote.hibrido ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Híbrido" className="input-field" />
                                <input name="peneira" value={lote.peneira ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Peneira" className="input-field" />
                                <input name="lote" value={lote.lote ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Lote" className="input-field" />
                                <input name="safra" value={lote.safra ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Safra" className="input-field" />
                                <input name="peso" type="text" value={lote.peso ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Peso (ex: 20,50)" required className="input-field" />
                                <input name="produtor" value={lote.produtor ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Produtor" required className="input-field" />
                                <input name="validade" type="text" value={lote.validade ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Validade (ex: MM/AA)" className="input-field" />
                                <input name="tratamento" value={lote.tratamento ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Tratamento" className="input-field" />
                                <input name="sacaria" value={lote.sacaria ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Sacaria" className="input-field" />
                                <input name="quantidadeLastro" type="number" value={lote.quantidadeLastro ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Quantidade Lastro" className="input-field" />
                                <input name="quantidadePalete" type="number" value={lote.quantidadePalete ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Quantidade Palete" className="input-field" />
                                <input name="formulaCalculo" type="text" value={lote.formulaCalculo ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Fórmula de Cálculo (ex: 10*60+5)" className="input-field" />
                                <input name="totalLote" type="text" value={lote.totalLote ?? ''} placeholder="Total do Lote" readOnly className="input-field bg-gray-200 cursor-not-allowed" />
                                <input name="localArmazenado" value={lote.localArmazenado ?? ''} onChange={(e) => handleLoteChange(index, e)} placeholder="Local Armazenado" className="input-field" />
                            </div>
                            {lotes.length > 1 && (
                                <button type="button" onClick={() => handleRemoveLote(index)} className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors">
                                    Remover Lote
                                </button>
                            )}
                        </div>
                    ))}

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button type="button" onClick={handleAddLote} className="w-full sm:w-1/2 py-3 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                            + Adicionar Lote
                        </button>
                        <button type="submit" disabled={loading} className="w-full sm:w-1/2 py-3 px-4 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {loading ? 'Processando...' : 'Gerar QR Code(s)'}
                        </button>
                    </div>
                </form>

                {qrCodeValues.length > 0 && (
                    <div className="qr-codes-container">
                        <button className="print-button" onClick={() => window.print()}>
                            Imprimir Etiquetas 🖨️
                        </button>
                        <h1>Etiquetas do Lote</h1>
                        <div className="qr-codes-grid">
                            {qrCodeValues.map((item, index) => (
                                <div key={item.id} className="qr-code-item">
                                    <div className="qr-code-info">
                                        <h3>Etiqueta {index + 1}</h3>
                                        <p><strong>ID:</strong> {item.id}</p>
                                        <p><strong>Lote:</strong> {item.lote}</p>
                                        <p><strong>Espécie:</strong> {item.especie}</p>
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
                )}
            </div>
        </div>
    );
}