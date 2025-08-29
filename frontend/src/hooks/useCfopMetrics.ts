
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

      console.log('🔍 Buscando métricas CFOP do Supabase...');

      // Buscar dados reais do Supabase
      const { data: cfopData, error: supabaseError } = await supabase
        .from('cfop_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (supabaseError) {
        throw new Error(`Erro Supabase: ${supabaseError.message}`);
      }

      if (cfopData && cfopData.length > 0) {
        console.log(`✅ ${cfopData.length} métricas CFOP carregadas do Supabase`);
        setData(cfopData);
      } else {
        console.log('📭 Nenhuma métrica CFOP encontrada no Supabase');
        setData([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro ao buscar dados de CFOP:', err);
      
      // Fallback: buscar dados do localStorage se Supabase falhar
      try {
        console.log('🔄 Tentando buscar dados do localStorage como fallback...');
        const dadosSalvos = localStorage.getItem('cfop_metrics');
        if (dadosSalvos) {
          const dadosLocal = JSON.parse(dadosSalvos);
          console.log(`✅ ${dadosLocal.length} métricas CFOP carregadas do localStorage`);
          setData(dadosLocal);
          setError(null); // Limpar erro se conseguiu carregar do localStorage
        }
      } catch (localError) {
        console.error('❌ Erro ao carregar dados do localStorage:', localError);
      }
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
