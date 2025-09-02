import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import QRCode from 'react-qr-code';

import './ItemDetails.css';

export default function ItemDetails() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchItem() {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('estoque_geral')
          .select('*')
          .eq('id', id)
          .single();
        if (error) {
          throw error;
        }
        setItem(data);
      } catch (err) {
        console.error("Erro ao buscar detalhes do item:", err);
        setError("Não foi possível carregar os detalhes do item. Tente novamente.");
        setItem(null);
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  // Função para lidar com a impressão
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="item-details-container loading">
        <p>Carregando detalhes do lote... ⏳</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="item-details-container error">
        <p>{error}</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="item-details-container not-found">
        <p>Nenhum item encontrado com o ID fornecido. 🔍</p>
      </div>
    );
  }

  const getValue = (key, unit = '') => {
    const value = item[key];
    const displayValue = value === null || value === '' || value === undefined ? 'Não Informado' : value;
    return unit && displayValue !== 'Não Informado' ? `${displayValue} ${unit}` : displayValue;
  };

  return (
    <div className="label-container">
      <div className="label-card">
        {/* Cabeçalho da etiqueta com logo e informações do lote */}
        <div className="header">
          <div className="header-logo">
            <span className="font-bold text-2xl text-gray-700">LONGPING<br/>HIGH-TECH</span>
          </div>
          <div className="header-info-grid">
            <div className="header-info-label">Lote</div>
            <div className="header-info-value">{getValue('lote')}</div>
            <div className="header-info-label">Safra</div>
            <div className="header-info-value">{getValue('safra')}</div>
            <div className="header-info-label">Cultivar</div>
            <div className="header-info-value">{getValue('cultivar')}</div>
            <div className="header-info-label">Data Amostragem</div>
            <div className="header-info-value">{getValue('data_amostragem')}</div>
          </div>
        </div>

        {/* Conteúdo principal - Grid de 3 colunas para o restante das informações */}
          <div className="content-grid">
            <div className="left-column">
              <div className="data-row">
                <span className="data-label">Peneira</span>
                <span className="data-value">{getValue('peneira')}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Categoria</span>
                <span className="data-value">{getValue('categoria')}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Tratamento</span>
                <span className="data-value">{getValue('tratamento')}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Espécie</span>
                <span className="data-value">{getValue('especie')}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Peso Saco</span>
                <span className="data-value">{getValue('peso', 'kg')}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Remetente</span>
                <span className="data-value">{getValue('remetente')}</span>
              </div>
              <div className="data-row data-row-last">
                <span className="data-label">Obs.</span>
                <span className="data-value">{getValue('obs')}</span>
              </div>
            </div>

            <div className="right-column">
              <div className="data-row">
                <span className="data-label">SL</span>
                <span className="data-value">{getValue('sl')}</span>
              </div>
              <div className="data-row">
                <span className="data-label">TS1S</span>
                <span className="data-value">{getValue('ts1s')}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Qtd. Sacos/Bags</span>
                <span className="data-value">{getValue('qtd_sacos_bags')}</span>
              </div>
              
              <div className="qr-code-section">
                <QRCode value={id} size={150} />
                <p className="qr-code-number">{id}</p>
              </div>
            </div>
          </div>
        </div>
        {/* O novo botão de impressão */}
        <button onClick={handlePrint} className="print-button">
          Imprimir Etiqueta
        </button>
      </div>
  );
}