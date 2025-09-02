// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Login from './Login'; // Importa a tela de login para redirecionamento

// Este componente recebe o componente que deve ser renderizado
// e o restante das props passadas pela rota.
export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica a sessão atual do usuário
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Monitora mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    // Exibe um estado de carregamento enquanto a sessão é verificada
    return <div>Carregando...</div>;
  }

  // Se houver uma sessão, renderiza o componente filho (o formulário)
  if (session) {
    return children;
  }

  // Se não houver sessão, redireciona para a página de login
  return <Login />;
}