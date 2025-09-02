import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import QRCodeScanner from './components/QRCodeScanner';
import EstoqueGeral from './components/EstoqueGeral'; // Importe o novo componente

import Login from './components/Login';
import RecebimentoExternoForm from './components/RecebimentoExternoForm';
import Dashboard from './components/Dashboard';
import Produtos from './components/Produtos';
import RecebimentoInternoForm from './components/RecebimentoInternoForm';
import ItemDetails from "./components/ItemDetails";
import TransferenciaForm from "./components/TransferenciaForm";
import './global.css';

function AppWrapper() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // Redirecionamento pode ser feito aqui, se necessário.
      } else {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/recebimento" element={session ? <RecebimentoExternoForm /> : <Login />} />
      <Route path="/recebimento-interno" element={session ? <RecebimentoInternoForm /> : <Login />} />
      <Route path="/produtos" element={session ? <Produtos /> : <Login />} />
      <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Login />} />
      <Route path="/scanner" element={session ? <QRCodeScanner /> : <Login />} />
      <Route path="/item/:id" element={session ? <ItemDetails /> : <Login />} />
      <Route path="/transferencia" element={session ? <TransferenciaForm /> : <Login />} />
      <Route path="/estoque-geral" element={session ? <EstoqueGeral /> : <Login />} /> {/* Adicione a rota para o Estoque Geral */}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
