import { useEffect, useState } from 'react';
import { supabase } from "../supabaseClient";
import { Html5QrcodeScanner } from 'html5-qrcode';
import FormContainer from './FormContainer'; // ajuste o caminho se necessário

export default function QRCodeScanner() {
  const [scannedData, setScannedData] = useState('');
  const [scannedItem, setScannedItem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 15,
      qrbox: 300,
    });

    scanner.render(async (decodedText) => {
      setScannedData(decodedText);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('estoque_geral')
        .select('*')
        .eq('id', decodedText)
        .single();

      if (dbError || !data) {
        setError('Item não encontrado.');
        setScannedItem(null);
      } else {
        setScannedItem(data);
      }
    });
  }, []);

  const thStyle = {
    border: '1px solid #ccc',
    padding: '8px',
    backgroundColor: '#f5f5f5',
    textAlign: 'left',
  };

  const tdStyle = {
    border: '1px solid #14eb38ff',
    padding: '8px',
  };

  return (
    <FormContainer>
      <h1>Leitor de QR Code</h1>
      <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>

      {scannedData && <p>Código lido: {scannedData}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {scannedItem && (
        <div style={{ marginTop: '20px' }}>
          <h3>Detalhes do Item</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Campo</th>
                <th style={thStyle}>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={tdStyle}>Espécie</td><td style={tdStyle}>{scannedItem.especie}</td></tr>
              <tr><td style={tdStyle}>Categoria</td><td style={tdStyle}>{scannedItem.categoria}</td></tr>
              <tr><td style={tdStyle}>Lote</td><td style={tdStyle}>{scannedItem.lote}</td></tr>
              <tr><td style={tdStyle}>Safra</td><td style={tdStyle}>{scannedItem.safra}</td></tr>
              <tr><td style={tdStyle}>Peso</td><td style={tdStyle}>{scannedItem.peso} kg</td></tr>
              <tr><td style={tdStyle}>Tratamento</td><td style={tdStyle}>{scannedItem.tratamento}</td></tr>
              <tr><td style={tdStyle}>Validade</td><td style={tdStyle}>{scannedItem.validade}</td></tr>
              <tr><td style={tdStyle}>Sacaria</td><td style={tdStyle}>{scannedItem.sacaria}</td></tr>
              <tr><td style={tdStyle}>Lastro</td><td style={tdStyle}>{scannedItem.quantidade_lastro}</td></tr>
              <tr><td style={tdStyle}>Palete</td><td style={tdStyle}>{scannedItem.quantidade_palete}</td></tr>
              <tr><td style={tdStyle}>Total do Lote</td><td style={tdStyle}>{scannedItem.total_lote}</td></tr>
              <tr><td style={tdStyle}>Posição Atual</td><td style={tdStyle}>{scannedItem.local_armazenado}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </FormContainer>
  );
}
