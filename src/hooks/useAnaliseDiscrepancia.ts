import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Tipo fornecido pelo usuário
export type Discrepancia = {
  id: number;
  produto: string;
  cfop: string;
  codigo: string;
  created_at: string;
  // Campos adicionais para compatibilidade com o sistema existente
  discrepancia_tipo?: string;
  discrepancia_valor?: number;
  entradas?: number;
  saidas?: number;
  est_inicial?: number;
  est_final?: number;
  est_calculado?: number;
  valor_total?: number;
  observacoes?: string;
};

// Configuração do Supabase
const supabaseUrl = 'https://hvjjcegcdivumprqviug.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface UseAnaliseDiscrepanciaReturn {
  discrepancias: Discrepancia[];
  carregando: boolean;
  erro: string | null;
  carregarDados: () => Promise<void>;
  carregarDadosSupabase: () => Promise<void>;
}

export const useAnaliseDiscrepancia = (): UseAnaliseDiscrepanciaReturn => {
  const [discrepancias, setDiscrepancias] = useState<Discrepancia[]>([]);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  // Função para carregar dados simulados (para demonstração)
  const carregarDados = useCallback(async (): Promise<void> => {
    setCarregando(true);
    setErro(null);
    
    try {
      // Simular dados de exemplo - em produção real viria do Supabase
      const dadosSimulados: Discrepancia[] = [
        {
          id: 1,
          produto: "NIS LAMEN 85G GALINHA CAIPIRA",
          cfop: "1102,5102",
          codigo: "12345",
          created_at: "2024-01-20T10:00:00Z",
          discrepancia_tipo: "Estoque Faltante",
          discrepancia_valor: 10,
          entradas: 175,
          saidas: 170,
          est_inicial: 50,
          est_final: 45,
          est_calculado: 55,
          valor_total: 1500,
          observacoes: "Possível venda sem nota"
        },
        {
          id: 2,
          produto: "CHOCOLATE LACTA 90G",
          cfop: "1102,5102",
          codigo: "002",
          created_at: "2024-01-20T10:01:00Z",
          discrepancia_tipo: "Sem Discrepância",
          discrepancia_valor: 0,
          entradas: 150,
          saidas: 120,
          est_inicial: 30,
          est_final: 60,
          est_calculado: 60,
          valor_total: 900,
          observacoes: "Estoque correto"
        },
        {
          id: 3,
          produto: "WAFER BAUDUCCO 140G",
          cfop: "1551,5405",
          codigo: "003",
          created_at: "2024-01-20T10:02:00Z",
          discrepancia_tipo: "Sem Discrepância",
          discrepancia_valor: 0,
          entradas: 200,
          saidas: 180,
          est_inicial: 25,
          est_final: 45,
          est_calculado: 45,
          valor_total: 760,
          observacoes: "Estoque correto"
        }
      ];
      
      // Simular delay da rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDiscrepancias(dadosSimulados);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setErro(errorMessage);
      console.error('Erro ao carregar dados simulados:', error);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Função para carregar dados reais do Supabase
  const carregarDadosSupabase = useCallback(async (): Promise<void> => {
    setCarregando(true);
    setErro(null);
    
    try {
      console.log('🔍 Buscando dados reais do Supabase...');
      
      const { data, error } = await supabase
        .from('analise_discrepancia')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro do Supabase: ${error.message}`);
      }

      // Garantir que os dados estão no formato correto
      const dadosFormatados: Discrepancia[] = (data || []).map((item: any): Discrepancia => ({
        id: item.id || 0,
        produto: String(item.produto || ''),
        cfop: String(item.cfop || ''),
        codigo: String(item.codigo || ''),
        created_at: item.created_at || new Date().toISOString(),
        discrepancia_tipo: item.discrepancia_tipo,
        discrepancia_valor: item.discrepancia_valor,
        entradas: item.entradas,
        saidas: item.saidas,
        est_inicial: item.est_inicial,
        est_final: item.est_final,
        est_calculado: item.est_calculado,
        valor_total: item.valor_total,
        observacoes: item.observacoes
      }));

      console.log(`✅ ${dadosFormatados.length} registros carregados do Supabase`);
      setDiscrepancias(dadosFormatados);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setErro(errorMessage);
      console.error('❌ Erro ao carregar dados do Supabase:', error);
      
      // Fallback para dados simulados em caso de erro
      console.log('🔄 Carregando dados simulados como fallback...');
      await carregarDados();
    } finally {
      setCarregando(false);
    }
  }, [carregarDados]);

  return {
    discrepancias,
    carregando,
    erro,
    carregarDados,
    carregarDadosSupabase
  };
};
