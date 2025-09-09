import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Html5QrcodeScanner } from 'html5-qrcode';
import "./TransferenciaForm.css"; // Importa o novo arquivo de estilo

// Componente auxiliar para integrar a nova biblioteca ao React
const QrScannerComponent = ({ onResult }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader", {
            qrbox: { width: 250, height: 250 },
            fps: 10,
            supportedScanFormats: ["QR_CODE"]
        },
        false);

        const onScanSuccess = (decodedText) => {
            scanner.clear();
            onResult(decodedText);
        };

        const onScanFailure = (error) => {
            console.warn(`Erro de leitura do código = ${error}`);
        };

        scanner.render(onScanSuccess, onScanFailure);

        return () => {
            scanner.clear().catch(error => {
                console.error("Falha ao limpar o scanner: ", error);
            });
        };
    }, [onResult]);

    return <div id="reader" ref={scannerRef}></div>;
};

export default function TransferenciaForm() {
    const [loteData, setLoteData] = useState(null);
    const [novaPosicao, setNovaPosicao] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isScanning, setIsScanning] = useState(true);

    const showMessage = (text, type = 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    const handleScan = async (result) => {
        setIsScanning(false);
        const itemId = result;
        if (itemId) {
            await fetchLoteData(itemId);
        }
    };

    const fetchLoteData = async (itemId) => {
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            const { data, error } = await supabase
                .from('estoque_geral')
                .select('*')
                .eq('id', itemId)
                .single();

            if (error) throw error;

            if (!data) {
                showMessage('Lote não encontrado no estoque.', 'info');
                setLoteData(null);
                return;
            }

            setLoteData(data);
        } catch (err) {
            console.error('Erro ao buscar dados do lote:', err);
            showMessage('Erro ao buscar os dados do lote. Tente novamente.', 'error');
            setLoteData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        if (!loteData || !novaPosicao) {
            showMessage('Preencha a nova posição e escaneie um item primeiro.', 'error');
            setLoading(false);
            return;
        }

        try {
            const { error: updateError } = await supabase
                .from('estoque_geral')
                .update({ local_armazenado: novaPosicao })
                .eq('id', loteData.id);

            if (updateError) throw updateError;

            showMessage('Transferência do palete realizada com sucesso!', 'success');
            
            // Resetar o formulário para uma nova transferência
            setLoteData(null);
            setNovaPosicao('');
            setIsScanning(true);
        } catch (err) {
            console.error('Erro na transferência:', err);
            showMessage('Falha na transferência. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="transferencia-container">
            <div className="transferencia-card">
                <h1 className="transferencia-title">Transferência de Posição 🚚</h1>

                {message.text && (
                    <div className={`transferencia-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {isScanning ? (
                    <div className="scanner-section">
                        <p className="scanner-text">Aponte a câmera para o QR Code do item que deseja transferir.</p>
                        <div className="scanner-wrapper">
                            <div className="scanner-camera-container">
                                <QrScannerComponent onResult={handleScan} />
                                <div className="scanner-frame"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {loteData ? (
                            <div className="lote-details-section">
                                <div className="lote-card">
                                    <h3 className="lote-details-title">Detalhes do Lote 📋</h3>
                                    <div className="lote-info">
                                        <p>ID: <strong className="font-mono">{loteData.id}</strong></p>
                                        <p>Espécie: <strong>{loteData.especie}</strong></p>
                                        <p>Lote: <strong>{loteData.lote}</strong></p>
                                        <p>Posição Atual: <strong>{loteData.local_armazenado}</strong></p>
                                        <p>Sacos no Palete: <strong>{loteData.quantidade_palete}</strong></p>
                                        <p>Total do Lote: <strong>{loteData.total_lote}</strong></p>
                                    </div>
                                </div>

                                <form onSubmit={handleTransfer} className="transferencia-form">
                                    <label className="form-label">
                                        <span className="label-text">Nova Posição:</span>
                                        <input
                                            type="text"
                                            value={novaPosicao}
                                            onChange={(e) => setNovaPosicao(e.target.value)}
                                            required
                                            className="form-input"
                                        />
                                    </label>
                                    
                                    <label className="form-label">
                                        <span className="label-text">Quantidade para Transferir (Palete Inteiro):</span>
                                        <input
                                            type="text"
                                            value={loteData.quantidade_palete}
                                            readOnly
                                            className="form-input-readonly"
                                        />
                                    </label>

                                    <div className="button-group">
                                        <button 
                                            type="submit" 
                                            disabled={loading} 
                                            className="transfer-button"
                                        >
                                            {loading ? 'Transferindo...' : 'Confirmar Transferência'}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsScanning(true)} 
                                            className="scan-button"
                                        >
                                            Escanear Outro QR Code
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <p className="status-message">Aguardando escaneamento...</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}