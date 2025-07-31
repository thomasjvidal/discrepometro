import { useState, useEffect } from 'react';
import { DiscrepanciaReal } from '../utils/realDiscrepancyCalculator';

export interface UseAnaliseDiscrepanciaReturn {
  discrepancias: DiscrepanciaReal[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAnaliseDiscrepancia(): UseAnaliseDiscrepanciaReturn {
  const [discrepancias, setDiscrepancias] = useState<DiscrepanciaReal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscrepancias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Buscando dados de análise real...');
      
      // PRIMEIRO: Tentar buscar dados do processamento atual
      const dadosSalvos = localStorage.getItem('analise_discrepancia');
      
      if (dadosSalvos) {
        const discrepanciasData = JSON.parse(dadosSalvos);
        
        // VALIDAR se os dados são reais (não simulados)
        const dadosReais = discrepanciasData.filter((item: DiscrepanciaReal) => {
          // Verificar se tem dados reais de processamento
          return item.produto && 
                 item.produto !== 'PRODUTO_DESCONHECIDO' &&
                 (item.entradas > 0 || item.saidas > 0 || item.est_inicial > 0 || item.est_final > 0);
        });
        
        if (dadosReais.length > 0) {
          console.log(`✅ ${dadosReais.length} discrepâncias REAIS encontradas`);
          setDiscrepancias(dadosReais);
        } else {
          console.log('⚠️ Dados encontrados mas parecem simulados, limpando...');
          localStorage.removeItem('analise_discrepancia');
          setDiscrepancias([]);
        }
      } else {
        console.log('📭 Nenhuma análise real encontrada');
        setDiscrepancias([]);
      }
      
    } catch (err) {
      console.error('❌ Erro ao buscar discrepâncias:', err);
      setError('Erro ao carregar dados da análise');
      setDiscrepancias([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchDiscrepancias();
  };

  useEffect(() => {
    fetchDiscrepancias();
  }, []);

  return {
    discrepancias,
    loading,
    error,
    refetch
  };
}
