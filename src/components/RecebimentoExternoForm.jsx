import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import './RecebimentoExternoForm.css';
import './Etiquetas.css';
import  './print.css';
import  '../global.css';  
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

const sanitize = (value) => value ?? '';

export default function RecebimentoExternoForm() {
  const [formData, setFormData] = useState({
    cliente: '',
    nomeTransportadora: '',
    motorista: '',
    placa: '',
    origem: '',
  });

  const [lotes, setLotes] = useState([initialLoteState()]);
  const [qrCodeValues, setQrCodeValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPaletes, setTotalPaletes] = useState(0);

  // useEffect para calcular o total de paletes automaticamente
  useEffect(() => {
    const newTotal = lotes.reduce((sum, lote) => {
      const quantidadePalete = parseInt(lote.quantidadePalete, 10);
      return sum + (isNaN(quantidadePalete) ? 0 : quantidadePalete);
    }, 0);
    setTotalPaletes(newTotal);
  }, [lotes]);

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
      const response = await fetch('http://localhost:3001/api/recebimento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: { ...formData, totalPaletes }, // Envia o total de paletes calculado
          lotes
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      setQrCodeValues(result.estoqueData);
      alert('Recebimento(s) registrado(s) com sucesso! QR Codes gerados.');
      setFormData({
        cliente: '',
        nomeTransportadora: '',
        motorista: '',
        placa: '',
        origem: '',
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
    <div className="container">
      <div className="form-wrapper">
        <h1 className="title">Recebimento Externo</h1>
        
        <form onSubmit={handleSubmit} className="form-container">
          
          {/* Seção de Dados do Transporte */}
          <div className="section-card">
            <h3 className="section-title">Dados do Transporte 🚛</h3>
            <div className="form-grid">
              <input name="cliente" value={formData.cliente} onChange={handleInputChange} placeholder="Cliente" required className="input-field" />
              <input name="nomeTransportadora" value={formData.nomeTransportadora} onChange={handleInputChange} placeholder="Transportadora" required className="input-field" />
              <input name="motorista" value={formData.motorista} onChange={handleInputChange} placeholder="Motorista" required className="input-field" />
              <input name="placa" value={formData.placa} onChange={handleInputChange} placeholder="Placa" required className="input-field" />
              <input name="origem" value={formData.origem} onChange={handleInputChange} placeholder="Origem" required className="input-field" />
              <div className="total-paletes-display">
                
                <span>{totalPaletes}</span>
              </div>
            </div>
          </div>
          
          {/* Seção de Dados dos Lotes */}
          {lotes.map((lote, index) => (
            <div key={lote.id} className="section-card lote-section">
              <h3 className="section-title">Dados do Lote {index + 1} 🌱</h3>
              <div className="form-grid">
                <input name="especie" value={sanitize(lote.especie)} onChange={(e) => handleLoteChange(index, e)} placeholder="Espécie" required className="input-field" />
                <input name="categoria" value={sanitize(lote.categoria)} onChange={(e) => handleLoteChange(index, e)} placeholder="Categoria" className="input-field" />
                <input name="hibrido" value={sanitize(lote.hibrido)} onChange={(e) => handleLoteChange(index, e)} placeholder="Híbrido" className="input-field" />
                <input name="peneira" value={sanitize(lote.peneira)} onChange={(e) => handleLoteChange(index, e)} placeholder="Peneira" className="input-field" />
                <input name="lote" value={sanitize(lote.lote)} onChange={(e) => handleLoteChange(index, e)} placeholder="Lote" className="input-field" />
                <input name="safra" value={sanitize(lote.safra)} onChange={(e) => handleLoteChange(index, e)} placeholder="Safra" className="input-field" />
                <input name="peso" type="text" value={sanitize(lote.peso)} onChange={(e) => handleLoteChange(index, e)} placeholder="Peso (ex: 20,50)" required className="input-field" />
                <input name="produtor" value={sanitize(lote.produtor)} onChange={(e) => handleLoteChange(index, e)} placeholder="Produtor" className="input-field" />
                <input name="validade" type="text" value={sanitize(lote.validade)} onChange={(e) => handleLoteChange(index, e)} placeholder="Validade (ex: MM/AA)" className="input-field" />
                <input name="tratamento" value={sanitize(lote.tratamento)} onChange={(e) => handleLoteChange(index, e)} placeholder="Tratamento" className="input-field" />
                <input name="sacaria" value={sanitize(lote.sacaria)} onChange={(e) => handleLoteChange(index, e)} placeholder="Sacaria" className="input-field" />
                <input name="quantidadeLastro" type="number" value={sanitize(lote.quantidadeLastro)} onChange={(e) => handleLoteChange(index, e)} placeholder="Quantidade Lastro" className="input-field" />
                <input name="quantidadePalete" type="number" value={sanitize(lote.quantidadePalete)} onChange={(e) => handleLoteChange(index, e)} placeholder="Quantidade Palete" className="input-field" />
                <input name="formulaCalculo" type="text" value={sanitize(lote.formulaCalculo)} onChange={(e) => handleLoteChange(index, e)} placeholder="Fórmula de Cálculo (ex: 10*60+5)" className="input-field" />
                <input name="totalLote" type="text" value={sanitize(lote.totalLote)} placeholder="Total do Lote" readOnly className="input-field read-only" />
                <input name="localArmazenado" value={sanitize(lote.localArmazenado)} onChange={(e) => handleLoteChange(index, e)} placeholder="Local Armazenado" className="input-field" />
              </div>
              {lotes.length > 1 && (
                <button type="button" onClick={() => handleRemoveLote(index)} className="remove-lote-button">
                  Remover Lote
                </button>
              )}
            </div>
          ))}

          {/* Botões de Ação */}
          <div className="button-group">
            <button type="button" onClick={handleAddLote} className="add-lote-button">
              + Adicionar Lote
            </button>
            <button type="submit" disabled={loading} className="submit-button">
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
            
            {/* Agrupamento por lote para contagem individual */}
            {Object.entries(qrCodeValues.reduce((groups, item) => {
              const loteKey = item.lote;
              if (!groups[loteKey]) {
                groups[loteKey] = [];
              }
              groups[loteKey].push(item);
              return groups;
            }, {})).map(([loteId, items]) => (
              <div key={loteId} className="lote-etiquetas-group">
                <h1 className="qr-title">Etiquetas do Lote: {loteId}</h1>
                <div className="qr-codes-grid">
                  {items.map((item, index) => (
                    <div key={item.id} className="qr-code-item">
                      <div className="qr-code-info">
                        <h3>Palete {index + 1}</h3>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}