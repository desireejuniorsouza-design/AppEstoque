// src/components/Login.jsx
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import FormContainer from "./FormContainer";

import { supabase } from "../supabaseClient";


import '../App.css'; // se App.css estiver em src/




export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();


  const handleLogin = async (event) => {
  event.preventDefault();
  setLoading(true);

  const { error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    // Usar uma modal customizada ao invés de alert()
    console.error(error.error_description || error.message);
    // TODO: Implementar uma modal para mostrar o erro ao usuário
  } else {
    // Usa navigate com replace: true para substituir a entrada atual no histórico de navegação
    // Isso impede que o usuário volte para a tela de login
    navigate('/dashboard', { replace: true });
  }

  setLoading(false);
};


  return (
    <div className="login-page">
      {/* Elemento de vídeo para o fundo */}
      <video id="background-video" autoPlay loop muted>
        <source src="/background-video.mp4" type="video/mp4" />
        Seu navegador não suporta o vídeo.
      </video>

      {/* Container do formulário com o efeito de vidro */}
      <div className="login-container">
        <h1>Bem-vindo de Volta</h1>
        <p>Faça login para continuar</p>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              id="email"
              className="inputField"
              type="email"
              placeholder="Seu email"
              value={email}
              required={true}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <input
              id="password"
              className="inputField"
              type="password"
              placeholder="Sua senha"
              value={password}
              required={true}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button className="button" disabled={loading}>
              {loading ? <span>Carregando...</span> : <span>Entrar</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
