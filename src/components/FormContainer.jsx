// src/components/FormContainer.jsx
import React from 'react';
import './FormContainer.css'; // se quiser adicionar estilos
import { supabase } from "../supabaseClient";




export default function FormContainer({ children }) {
  return <div className="form-container">{children}</div>;
}
