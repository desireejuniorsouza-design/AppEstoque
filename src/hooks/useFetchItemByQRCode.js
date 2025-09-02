import { useState } from 'react';
import { supabase } from '../supabaseClient';

export function useFetchItemByQRCode() {
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);

  const fetchItem = async (qrCode) => {
    const { data, error: dbError } = await supabase
      .from('estoque_geral')
      .select('*')
      .eq('qr_code_id', qrCode)
      .single();

    if (dbError) {
      setError('Item não encontrado.');
      setItem(null);
    } else {
      setItem(data);
      setError(null);
    }
  };

  return { item, error, fetchItem };
}
