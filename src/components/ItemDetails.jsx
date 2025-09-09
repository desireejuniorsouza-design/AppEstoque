import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import QRCode from 'react-qr-code';

import './ItemDetails.css';
// Importe o CSS para estilizar as etiquetas se não estiver em ItemDetails.css
// import './Etiquetas.css'; 

export default function ItemDetails() {
    const { id } = useParams();

    const [loteItems, setLoteItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchLoteItems() {
            if (!id) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                // Primeiro, busca o item individual para obter o ID do lote
                const { data: itemData, error: itemError } = await supabase
                    .from('estoque_geral')
                    .select('lote')
                    .eq('id', id)
                    .single();

                if (itemError || !itemData) {
                    throw new Error("ID do item não encontrado.");
                }

                // Em seguida, busca todos os itens que têm o mesmo ID de lote
                const { data: loteData, error: loteError } = await supabase
                    .from('estoque_geral')
                    .select('*')
                    .eq('lote', itemData.lote);

                if (loteError) {
                    throw loteError;
                }
                setLoteItems(loteData);

            } catch (err) {
                console.error("Erro ao buscar detalhes do lote:", err);
                setError("Não foi possível carregar os detalhes do lote. Tente novamente.");
                setLoteItems([]);
            } finally {
                setLoading(false);
            }
        }
        fetchLoteItems();
    }, [id]);

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

    if (!loteItems || loteItems.length === 0) {
        return (
            <div className="item-details-container not-found">
                <p>Nenhum item encontrado para este lote. 🔍</p>
            </div>
        );
    }

    // Obtém o nome da espécie e o total do lote do primeiro item, já que são os mesmos para todos
    const especie = loteItems[0].especie;
    const total_lote = loteItems[0].total_lote;

    return (
    <div className="label-container">
        <button onClick={handlePrint} className="print-button">
            Imprimir Etiqueta 🖨️
        </button>
        {/* Este é o container que será impresso */}
        <div className="label-card-group"> 
            <h1>Etiquetas do Lote</h1>
            <p><strong>Espécie:</strong> {especie}</p>
            <p><strong>Total do Lote:</strong> {total_lote} sacos</p>

            <div className="qr-codes-grid">
                {loteItems.map((item, index) => (
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
    </div>
    );
}