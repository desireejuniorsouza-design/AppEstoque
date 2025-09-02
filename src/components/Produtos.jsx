import { useState } from 'react';
import { supabase } from "../supabaseClient";
import QRCode from 'react-qr-code'; // npm install react-qr-code

export default function Produtos() {
  const [formData, setFormData] = useState({
    especie: '',
    categoria: '',
    hibrido: '',
    peneira: '',
    lote: '',
    safra: '',
    peso: '',
    validade: '',
    tratamento: '',
    sacaria: '',
    quantidadeLastro: '',
    quantidadePalete: '',
  });

  const [qrCodeValue, setQrCodeValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('produtos')
        .insert({
          especie: formData.especie,
          categoria: formData.categoria,
          hibrido: formData.hibrido,
          peneira: formData.peneira,
          lote: formData.lote,
          safra: formData.safra,
          peso: formData.peso,
          validade: formData.validade,
          tratamento: formData.tratamento,
          sacaria: formData.sacaria,
          quantidade_lastro: formData.quantidadeLastro,
          quantidade_palete: formData.quantidadePalete,
        })
        .select();

      if (error) throw error;

      const produtoId = data[0].id;
      setQrCodeValue(produtoId);
      alert('Produto cadastrado com sucesso!');
      setFormData({
        especie: '',
        categoria: '',
        hibrido: '',
        peneira: '',
        lote: '',
        safra: '',
        peso: '',
        validade: '',
        tratamento: '',
        sacaria: '',
        quantidadeLastro: '',
        quantidadePalete: '',
      });

    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      alert('Erro ao cadastrar produto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Cadastro de Produto</h1>
      <form onSubmit={handleSubmit}>
        <input name="especie" value={formData.especie} onChange={handleChange} placeholder="Espécie" required />
        <input name="categoria" value={formData.categoria} onChange={handleChange} placeholder="Categoria" />
        <input name="hibrido" value={formData.hibrido} onChange={handleChange} placeholder="Híbrido" />
        <input name="peneira" value={formData.peneira} onChange={handleChange} placeholder="Peneira" />
        <input name="lote" value={formData.lote} onChange={handleChange} placeholder="Lote" />
        <input name="safra" value={formData.safra} onChange={handleChange} placeholder="Safra" />
        <input name="peso" type="number" step="0.01" value={formData.peso} onChange={handleChange} placeholder="Peso (kg)" />
        <input name="validade" type="date" value={formData.validade} onChange={handleChange} placeholder="Validade" />
        <input name="tratamento" value={formData.tratamento} onChange={handleChange} placeholder="Tratamento" />
        <input name="sacaria" value={formData.sacaria} onChange={handleChange} placeholder="Sacaria" />
        <input name="quantidadeLastro" type="number" value={formData.quantidadeLastro} onChange={handleChange} placeholder="Quantidade Lastro" />
        <input name="quantidadePalete" type="number" value={formData.quantidadePalete} onChange={handleChange} placeholder="Quantidade Palete" />

        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar Produto'}
        </button>
      </form>

      {qrCodeValue && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3>QR Code do Produto</h3>
          <p>ID: {qrCodeValue}</p>
          <QRCode value={qrCodeValue} size={256} />
        </div>
      )}
    </div>
  );
}
