import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import QRCode from 'react-qr-code';

import './ItemDetails.css';
// Importe o CSS do primeiro componente se as classes `qr-code-item` não estiverem em ItemDetails.css
// import './Etiquetas.css'; 

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

    // NOVO BLOCO RETURN COM O MODELO DA ETIQUETA QUE VOCÊ QUER
    return (
        <div className="label-container">
            <button onClick={handlePrint} className="print-button">
                Imprimir Etiqueta 🖨️
            </button>
            <div className="label-card">
                <div className="qr-code-item">
                    <div className="qr-code-info">
                        <h3>Etiqueta do Palete</h3>
                        <p><strong>ID:</strong> {item.id}</p>
                        <p><strong>Espécie:</strong> {getValue('especie')}</p>
                        <p><strong>Lote:</strong> {getValue('lote')}</p>
                        <p><strong>Tratamento:</strong> {getValue('tratamento')}</p>
                        <p><strong>Sacos no Palete:</strong> {getValue('quantidade_palete')}</p>
                        <p><strong>Total do Lote:</strong> {getValue('total_lote')}</p>
                        <p><strong>Posição Atual:</strong> {getValue('local_armazenado')}</p>
                    </div>
                    <div className="qr-code-image">
                        <QRCode value={item.id} size={180} />
                    </div>
                </div>
            </div>
        </div>
    );
}