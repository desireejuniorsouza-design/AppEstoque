import { useState } from 'react';
//import { supabase } from "../supabaseClient";
import QRCode from 'react-qr-code';
import { v4 as uuidv4 } from 'uuid';
import './RecebimentoExternoForm.css';
import './Etiquetas.css';



// Estado inicial para um único lote
const initialLoteState = () => ({
  id: Date.now(), // Mantido Date.now() como no seu código original
  especie: '',
  categoria: '',
  hibrido: '',
  peneira: '',
  lote: '',
  safra: '',
  peso: '',
  produtor: '',
  validade: '',
  tratamento: '',
  sacaria: '',
  quantidadeLastro: '',
  quantidadePalete: '',
  formulaCalculo: '',
  totalLote: '',
  localArmazenado: ''
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

export default function RecebimentoExternoForm() {
  const [formData, setFormData] = useState({
    cliente: '',
    nomeTransportadora: '',
    motorista: '',
    placa: '',
    origem: '',
    totalPaletes: '',
  });

  const [lotes, setLotes] = useState([initialLoteState()]);
  const [qrCodeValues, setQrCodeValues] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
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

  const handleAddLote = () => {
    setLotes([...lotes, initialLoteState()]);
  };

  const handleRemoveLote = (index) => {
    const newLotes = lotes.filter((_, i) => i !== index);
    setLotes(newLotes);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setQrCodeValues([]);

  try {
    // Envia os dados para a nova API do Express
    const response = await fetch('http://localhost:3001/api/recebimento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ formData, lotes }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro desconhecido');
    }

    setQrCodeValues(result.estoqueData);

    alert('Recebimento(s) registrado(s) com sucesso! QR Codes gerados.');

    // Reseta o estado do formulário
    setFormData({
      cliente: '',
      nomeTransportadora: '',
      motorista: '',
      placa: '',
      origem: '',
      totalPaletes: '',
    });
    setLotes([initialLoteState()]);

  } catch (error) {
    console.error('Erro ao processar o formulário:', error);
    alert(`Erro ao registrar recebimento: ${error.message}. Tente novamente.`);
    setQrCodeValues([]);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-8 ">
        <h1 className="text-3xl font-bold text-gray-800 text-center">Recebimento Externo</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Seção de Dados do Transporte */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Dados do Transporte 🚛</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="cliente" value={formData.cliente} onChange={handleInputChange} placeholder="Cliente" required className="input-field" />
              <input name="nomeTransportadora" value={formData.nomeTransportadora} onChange={handleInputChange} placeholder="Transportadora" required className="input-field" />
              <input name="motorista" value={formData.motorista} onChange={handleInputChange} placeholder="Motorista" required className="input-field" />
              <input name="placa" value={formData.placa} onChange={handleInputChange} placeholder="Placa" required className="input-field" />
              <input name="origem" value={formData.origem} onChange={handleInputChange} placeholder="Origem" required className="input-field" />
              <input name="totalPaletes" type="number" value={formData.totalPaletes} onChange={handleInputChange} placeholder="Total de Paletes" className="input-field" />
            </div>
          </div>
          
          {/* Seção de Dados dos Lotes */}
          {lotes.map((lote, index) => (
            <div key={lote.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm lote-section">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Dados do Lote {index + 1} 🌱</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="especie" value={lote.especie} onChange={(e) => handleLoteChange(index, e)} placeholder="Espécie" required className="input-field" />
                <input name="categoria" value={lote.categoria} onChange={(e) => handleLoteChange(index, e)} placeholder="Categoria" className="input-field" />
                <input name="hibrido" value={lote.hibrido} onChange={(e) => handleLoteChange(index, e)} placeholder="Híbrido" className="input-field" />
                <input name="peneira" value={lote.peneira} onChange={(e) => handleLoteChange(index, e)} placeholder="Peneira" className="input-field" />
                <input name="lote" value={lote.lote} onChange={(e) => handleLoteChange(index, e)} placeholder="Lote" className="input-field" />
                <input name="safra" value={lote.safra} onChange={(e) => handleLoteChange(index, e)} placeholder="Safra" className="input-field" />
                <input name="peso" type="text" value={lote.peso} onChange={(e) => handleLoteChange(index, e)} placeholder="Peso (ex: 20,50)" required className="input-field" />
                <input name="produtor" value={lote.produtor} onChange={(e) => handleLoteChange(index, e)} placeholder="Produtor" className="input-field" />
                <input name="validade" type="text" value={lote.validade} onChange={(e) => handleLoteChange(index, e)} placeholder="Validade (ex: MM/AA)" className="input-field" />
                <input name="tratamento" value={lote.tratamento} onChange={(e) => handleLoteChange(index, e)} placeholder="Tratamento" className="input-field" />
                <input name="sacaria" value={lote.sacaria} onChange={(e) => handleLoteChange(index, e)} placeholder="Sacaria" className="input-field" />
                <input name="quantidadeLastro" type="number" value={lote.quantidadeLastro} onChange={(e) => handleLoteChange(index, e)} placeholder="Quantidade Lastro" className="input-field" />
                <input name="quantidadePalete" type="number" value={lote.quantidadePalete} onChange={(e) => handleLoteChange(index, e)} placeholder="Quantidade Palete" className="input-field" />
                <input name="formulaCalculo" type="text" value={lote.formulaCalculo} onChange={(e) => handleLoteChange(index, e)} placeholder="Fórmula de Cálculo (ex: 10*60+5)" className="input-field" />
                <input name="totalLote" type="text" value={lote.totalLote} placeholder="Total do Lote" readOnly className="input-field bg-gray-200 cursor-not-allowed" />
                <input name="localArmazenado" value={lote.localArmazenado} onChange={(e) => handleLoteChange(index, e)} placeholder="Local Armazenado" className="input-field" />
              </div>
              {lotes.length > 1 && (
                <button type="button" onClick={() => handleRemoveLote(index)} className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors">
                  Remover Lote
                </button>
              )}
            </div>
          ))}

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button type="button" onClick={handleAddLote} className="w-full sm:w-1/2 py-3 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
              + Adicionar Lote
            </button>
            <button type="submit" disabled={loading} className="w-full sm:w-1/2 py-3 px-4 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
              {loading ? 'Processando...' : 'Gerar QR Code(s)'}
            </button>
          </div>
        </form>

        {/* Seção de QR Codes para impressão */}
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
                    <p><strong>Posição Atual: {item.local_armazenado}</strong></p>
                    
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