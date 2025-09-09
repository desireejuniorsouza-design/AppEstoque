import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import "./Dashboard.css"; // Importa o novo arquivo de estilo

export default function Dashboard({ session }) {
    const navigate = useNavigate();
    const [loteId, setLoteId] = useState('');
    const [posicaoAtual, setPosicaoAtual] = useState('');
    const [resultadosPosicao, setResultadosPosicao] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        if (session === null) {
            navigate('/login');
        }
    }, [session, navigate]);

    const showMessage = (text, type = 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleVerLote = async () => {
        if (!loteId) {
            showMessage('Por favor, digite um lote.', 'error');
            return;
        }
        setMessage({ text: '', type: '' });
        setResultadosPosicao([]);
        try {
            const { data, error } = await supabase
                .from('estoque_geral')
                .select('id')
                .eq('lote', loteId);

            if (error) {
                throw error;
            }

            if (data && data.length > 0) {
                navigate(`/item/${data[0].id}`);
            } else {
                showMessage('Lote não encontrado.', 'info');
            }
        } catch (error) {
            console.error('Erro ao buscar o item pelo lote:', error);
            showMessage('Erro ao buscar o item. Por favor, tente novamente.', 'error');
        }
    };

    const handleVerPosicao = async () => {
        if (!posicaoAtual) {
            showMessage('Por favor, digite a posição.', 'error');
            return;
        }
        setMessage({ text: '', type: '' });
        try {
            const { data, error } = await supabase
                .from('estoque_geral')
                .select('id, hibrido, peneira, lote, quantidade_palete')
                .eq('local_armazenado', posicaoAtual);

            if (error) {
                throw error;
            }

            if (data && data.length > 0) {
                setResultadosPosicao(data);
                showMessage(`Encontrado ${data.length} item(ns) na posição: ${posicaoAtual}`, 'success');
            } else {
                setResultadosPosicao([]);
                showMessage('Nenhum item encontrado nesta posição.', 'info');
            }
        } catch (error) {
            console.error('Erro ao buscar o item pela posição:', error);
            showMessage('Erro ao buscar o item. Por favor, tente novamente.', 'error');
        }
    };

    if (session === undefined) {
        return <p>Carregando...</p>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-card">
                <div className="dashboard-header">
                    <h2 className="dashboard-title">
                        Bem-vindo, {session?.user?.email}
                    </h2>
                    <p className="dashboard-subtitle">
                        Escolha uma opção abaixo:
                    </p>
                </div>

                {message.text && (
                    <div
                        className={`message ${message.type}`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Botões de Ação - Grid responsivo */}
                <div className="button-grid">
                    <button onClick={() => navigate('/recebimento')} className="action-button">
                        📦 Recebimento Externo
                    </button>
                    <button onClick={() => navigate('/produtos')} className="action-button">
                        🧾 Cadastro de Produtos
                    </button>
                    <button onClick={() => navigate('/estoque-geral')} className="action-button">
                        📊 Gestão de Estoque
                    </button>
                    <button onClick={() => navigate('/recebimento-interno')} className="action-button">
                        🏡 Recebimento Interno
                    </button>
                    <button onClick={() => navigate('/scanner')} className="action-button">
                        📷 Leitor de QR Code
                    </button>
                    <button onClick={() => navigate('/transferencia')} className="action-button">
                        🚚 Transferência de Posição
                    </button>
                </div>

                {/* Seção de Busca */}
                <div className="search-section">
                    <div className="search-group">
                        <input
                            type="text"
                            value={loteId}
                            onChange={(e) => setLoteId(e.target.value)}
                            placeholder="Digite o número do lote"
                            className="search-input"
                        />
                        <button onClick={handleVerLote} className="search-button">
                            🔍 Lote
                        </button>
                    </div>

                    <div className="search-group">
                        <input
                            type="text"
                            value={posicaoAtual}
                            onChange={(e) => setPosicaoAtual(e.target.value)}
                            placeholder="Digite a posição atual"
                            className="search-input"
                        />
                        <button onClick={handleVerPosicao} className="search-button">
                            🗺️ Posição
                        </button>
                    </div>
                </div>
                
                {/* Lista de Resultados - Scrollable */}
                <div className="results-list">
                    {resultadosPosicao.length > 0 ? (
                        <div>
                            <h3 className="results-title">Itens na Posição: {posicaoAtual}</h3>
                            <ul className="results-items">
                                {resultadosPosicao.map(item => (
                                    <li
                                        key={item.id}
                                        className="result-item"
                                        onClick={() => navigate(`/item/${item.id}`)}
                                    >
                                        <p className="item-title">Híbrido: {item.hibrido}</p>
                                        <p className="item-details">Peneira: {item.peneira} | Lote: {item.lote}</p>
                                        <p className="item-quantity">Quantidade: {item.quantidade_palete}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="results-placeholder">Nenhum item para exibir. Use as opções acima.</p>
                    )}
                </div>
                
                {/* Botão de Sair */}
                <button onClick={handleLogout} className="logout-button">
                    Sair
                </button>
            </div>
        </div>
    );
}