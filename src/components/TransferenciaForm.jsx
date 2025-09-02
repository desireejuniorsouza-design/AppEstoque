import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Html5QrcodeScanner } from 'html5-qrcode';

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
        <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center font-sans">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6 text-gray-800">
                
                <h1 className="text-2xl md:text-3xl font-bold text-center">Transferência de Posição 🚚</h1>

                {message.text && (
                    <div className={`p-4 rounded-lg font-medium text-center transition-all duration-300
                        ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' : ''}
                        ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : ''}
                        ${message.type === 'info' ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
                    `}>
                        {message.text}
                    </div>
                )}

                {isScanning ? (
                    <div className="space-y-4">
                        <p className="text-center text-gray-600">Aponte a câmera para o QR Code do item que deseja transferir.</p>
                        <div className="w-full flex justify-center">
                            <div className="w-full max-w-xs aspect-square border-2 border-dashed border-gray-300 rounded-xl overflow-hidden relative">
                                <QrScannerComponent onResult={handleScan} />
                                <div className="absolute top-0 left-0 w-full h-full bg-transparent border-4 border-indigo-500 rounded-xl pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {loteData ? (
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-inner">
                                    <h3 className="text-xl font-semibold mb-3">Detalhes do Lote 📋</h3>
                                    <div className="space-y-2 text-sm">
                                        <p>ID: <strong className="font-mono">{loteData.id}</strong></p>
                                        <p>Espécie: <strong>{loteData.especie}</strong></p>
                                        <p>Lote: <strong>{loteData.lote}</strong></p>
                                        <p>Posição Atual: <strong>{loteData.local_armazenado}</strong></p>
                                        <p>Sacos no Palete: <strong>{loteData.quantidade_palete}</strong></p>
                                        <p>Total do Lote: <strong>{loteData.total_lote}</strong></p>
                                    </div>
                                </div>

                                <form onSubmit={handleTransfer} className="space-y-4">
                                    <label className="block">
                                        <span className="text-gray-700 font-medium">Nova Posição:</span>
                                        <input
                                            type="text"
                                            value={novaPosicao}
                                            onChange={(e) => setNovaPosicao(e.target.value)}
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
                                        />
                                    </label>
                                    
                                    <label className="block">
                                        <span className="text-gray-700 font-medium">Quantidade para Transferir (Palete Inteiro):</span>
                                        <input
                                            type="text"
                                            value={loteData.quantidade_palete}
                                            readOnly
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-200 cursor-not-allowed p-2"
                                        />
                                    </label>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button 
                                            type="submit" 
                                            disabled={loading} 
                                            className="w-full flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Transferindo...' : 'Confirmar Transferência'}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsScanning(true)} 
                                            className="w-full flex-1 py-3 px-4 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                                        >
                                            Escanear Outro QR Code
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">Aguardando escaneamento...</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}