import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import "./Dashboard.css";

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
    <div className="min-h-screen bg-gray-100 flex justify-center items-start p-4 md:p-8 font-inter">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-6 md:p-8 flex flex-col gap-6">
        
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">
            Bem-vindo, {session?.user?.email}
          </h2>
          <p className="text-gray-500 text-base md:text-lg mt-1">
            Escolha uma opção abaixo:
          </p>
        </div>

        {message.text && (
          <div 
            className={`p-3 md:p-4 rounded-xl font-medium text-sm md:text-base text-center transition-all duration-300
              ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' : ''}
              ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : ''}
              ${message.type === 'info' ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
            `}
          >
            {message.text}
          </div>
        )}

        {/* Botões de Ação - Grid responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button onClick={() => navigate('/recebimento')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl shadow-md transition-all duration-200">
            📦 Recebimento Externo
          </button>
          <button onClick={() => navigate('/produtos')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl shadow-md transition-all duration-200">
            🧾 Cadastro de Produtos
          </button>
          <button onClick={() => navigate('/estoque-geral')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl shadow-md transition-all duration-200">
            📊 Gestão de Estoque
          </button>
          <button onClick={() => navigate('/recebimento-interno')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl shadow-md transition-all duration-200">
            🏡 Recebimento Interno
          </button>
          <button onClick={() => navigate('/scanner')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl shadow-md transition-all duration-200">
            📷 Leitor de QR Code
          </button>
          <button onClick={() => navigate('/transferencia')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl shadow-md transition-all duration-200">
            🚚 Transferência de Posição
          </button>
        </div>

        {/* Seção de Busca */}
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={loteId}
              onChange={(e) => setLoteId(e.target.value)}
              placeholder="Digite o número do lote"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <button onClick={handleVerLote} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-200 w-full sm:w-auto">
              🔍 Lote
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={posicaoAtual}
              onChange={(e) => setPosicaoAtual(e.target.value)}
              placeholder="Digite a posição atual"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <button onClick={handleVerPosicao} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-200 w-full sm:w-auto">
              🗺️ Posição
            </button>
          </div>
        </div>
        
        {/* Lista de Resultados - Scrollable */}
        <div className="overflow-y-auto max-h-64 border border-gray-200 rounded-xl p-4 bg-gray-50">
          {resultadosPosicao.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Itens na Posição: {posicaoAtual}</h3>
              <ul className="space-y-2">
                {resultadosPosicao.map(item => (
                  <li 
                    key={item.id}
                    className="p-3 bg-white rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:bg-indigo-50 transition-colors"
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    <p className="font-bold text-gray-800">Híbrido: {item.hibrido}</p>
                    <p className="text-gray-600 text-sm">Peneira: {item.peneira} | Lote: {item.lote}</p>
                    <p className="text-sm text-gray-500 mt-1">Quantidade: {item.quantidade_palete}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-center text-gray-400 p-4">Nenhum item para exibir. Use as opções acima.</p>
          )}
        </div>
        
        {/* Botão de Sair */}
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl shadow-md transition-all duration-200 mt-4">
          Sair
        </button>
      </div>
    </div>
  );
}
