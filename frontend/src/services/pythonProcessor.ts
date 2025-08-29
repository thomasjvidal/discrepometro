export interface ProcessResponse {
  success: boolean;
  message: string;
  data?: any;
  arquivo_resultado?: string;
  timestamp: string;
  error?: string;
}

export interface DiscrepancyResult {
  produto: string;
  codigo: string;
  estoque_inicial: number;
  vendas: number;
  estoque_final: number;
  estoque_esperado: number;
  discrepancia: number;
  status: 'OK' | 'ERRO';
  tipo_discrepancia: string;
  tolerancia: number;
}

export interface AnalysisReport {
  metadata: {
    timestamp: string;
    versao: string;
    total_produtos: number;
    produtos_ok: number;
    produtos_erro: number;
    tolerancia: number;
    max_produtos: number;
  };
  arquivos_processados: {
    planilha: string;
    pdf_inicial: string;
    pdf_final: string;
  };
  relatorio: {
    resumo_geral: {
      total_produtos: number;
      produtos_ok: number;
      produtos_erro: number;
      percentual_erro: number;
    };
    analise_discrepancias: {
      estoque_excedente: number;
      estoque_faltante: number;
      total_discrepancia: number;
    };
    valores_totais: {
      total_vendas: number;
      total_estoque_inicial: number;
      total_estoque_final: number;
    };
    produtos_maior_discrepancia: Array<{
      produto: string;
      discrepancia: number;
      tipo: string;
    }>;
    recomendacoes: string[];
  };
  resultados: DiscrepancyResult[];
}

/**
 * Processa arquivos usando a API Python do Discrepômetro
 * @param files Lista de arquivos para processar
 * @param maxProdutos Número máximo de produtos para analisar
 * @param tolerancia Tolerância para discrepâncias
 * @returns Resultado da análise completa
 */
export async function processarArquivosPython(
  files: File[], 
  maxProdutos: number = 10, 
  tolerancia: number = 1.0
): Promise<ProcessResponse> {
  console.log('🐍 Iniciando processamento Python com', files.length, 'arquivos');
  console.log(`📊 Configuração: max_produtos=${maxProdutos}, tolerancia=${tolerancia}`);
  
  const formData = new FormData();
  
  // Adicionar arquivos
  files.forEach(file => {
    formData.append('files', file);
    console.log(`📎 Adicionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  });
  
  // Adicionar parâmetros
  formData.append('max_produtos', maxProdutos.toString());
  formData.append('tolerancia', tolerancia.toString());

  try {
    const response = await fetch('http://localhost:8000/process_files', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro HTTP:', response.status, errorText);
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Processamento Python concluído com sucesso');
    console.log('📊 Resultados:', result.data?.metadata);
    
    return result;

  } catch (error) {
    console.error('❌ Erro no processamento Python:', error);
    throw error;
  }
}

/**
 * Verifica se o servidor Python está online
 */
export async function verificarStatusServidor(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8000/status');
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.status === 'online';
  } catch (error) {
    console.error('❌ Servidor Python offline:', error);
    return false;
  }
}

/**
 * Recupera resultados de uma análise específica
 */
export async function getResultadosAnalise(filename: string): Promise<AnalysisReport> {
  try {
    const response = await fetch(`http://localhost:8000/get_results/${filename}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao recuperar resultados: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
    
  } catch (error) {
    console.error('❌ Erro ao recuperar resultados:', error);
    throw error;
  }
}

/**
 * Lista todos os resultados disponíveis
 */
export async function listarResultados(): Promise<Array<{
  filename: string;
  size: number;
  created: string;
  modified: string;
}>> {
  try {
    const response = await fetch('http://localhost:8000/list_results');
    
    if (!response.ok) {
      throw new Error(`Erro ao listar resultados: ${response.status}`);
    }
    
    const result = await response.json();
    return result.files;
    
  } catch (error) {
    console.error('❌ Erro ao listar resultados:', error);
    throw error;
  }
}

/**
 * Obtém informações básicas da API
 */
export async function getInfoAPI(): Promise<{
  message: string;
  version: string;
  status: string;
  endpoints: Record<string, string>;
}> {
  try {
    const response = await fetch('http://localhost:8000/');
    
    if (!response.ok) {
      throw new Error(`Erro ao obter informações da API: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('❌ Erro ao obter informações da API:', error);
    throw error;
  }
} 