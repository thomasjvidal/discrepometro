
import { useState, useEffect } from 'react';

interface CfopMetric {
  id: string;
  cfop: string;
  valor: number;
  user_id: string;
  created_at: string;
}

export const useCfopMetrics = () => {
  const [data, setData] = useState<CfopMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCfopMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        'https://hvjjcegcdivumprqviug.supabase.co/rest/v1/cfop_metrics?order=created_at.desc',
        {
          method: 'GET',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao buscar dados de CFOP:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCfopMetrics();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchCfopMetrics
  };
};
