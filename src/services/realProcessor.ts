import { lerExcelReal } from '@/utils/realExcelReader';

export interface ProcessamentoProgress {
  etapa: string;
  mensagem: string;
  detalhes?: string;
  progresso: number;
}

export interface ProcessamentoResultado {
  success: boolean;
  message?: string;
  totalProcessados?: number;
  tempoProcessamento?: number;
}

// Função para enviar arquivos para o backend
async function enviarParaBackend(files: File[], onProgress?: (progress: ProcessamentoProgress) => void): Promise<ProcessamentoResultado> {
  try {
    console.log('🚀 Enviando arquivos para backend...');
    
    // Separar arquivos por tipo
    const excel = files.find(f => f.name.toLowerCase().includes('.xls') || f.name.toLowerCase().includes('.csv'));
    const pdfs = files.filter(f => f.name.toLowerCase().includes('.pdf'));
    
    if (!excel || pdfs.length < 2) {
      throw new Error('São necessários: 1 Excel + 2 PDFs');
    }
    
    // Ordenar PDFs por nome (assumindo que contém ano)
    const pdfInicial = pdfs.find(f => f.name.toLowerCase().includes('2023') || f.name.toLowerCase().includes('inicial'));
    const pdfFinal = pdfs.find(f => f.name.toLowerCase().includes('2024') || f.name.toLowerCase().includes('final'));
    
    if (!pdfInicial || !pdfFinal) {
      throw new Error('PDFs devem conter "2023/inicial" e "2024/final" no nome');
    }
    
    // Criar FormData
    const formData = new FormData();
    formData.append('excel', excel);
    formData.append('pdfInicial', pdfInicial);
    formData.append('pdfFinal', pdfFinal);
    
    console.log('📁 Arquivos preparados:', {
      excel: excel.name,
      pdfInicial: pdfInicial.name,
      pdfFinal: pdfFinal.name
    });
    
    // Atualizar progresso
    if (onProgress) {
      onProgress({
        etapa: 'Enviando para Backend',
        mensagem: 'Conectando com servidor...',
        progresso: 10
      });
    }
    
    // Enviar para backend
    const response = await fetch('http://localhost:3001/api/analisar', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro do servidor: ${response.status} - ${errorText}`);
    }
    
    const resultado = await response.json();
    
    if (resultado.success) {
      // Salvar resultados no localStorage
      localStorage.setItem('analise_discrepancia', JSON.stringify(resultado.resultados));
      
      console.log('✅ Análise concluída pelo backend:', resultado);
      
      return {
        success: true,
        totalProcessados: resultado.total_processados,
        tempoProcessamento: resultado.tempo_processamento
      };
    } else {
      throw new Error(resultado.message || 'Erro desconhecido do backend');
    }
    
  } catch (error) {
    console.error('❌ Erro ao enviar para backend:', error);
    throw error;
  }
}

// Função principal de processamento
export async function processarArquivosReais(
  files: File[],
  onProgress?: (progress: ProcessamentoProgress) => void
): Promise<ProcessamentoResultado> {
  console.log('🚀 INICIANDO PROCESSAMENTO REAL...');
  console.log('📁 Arquivos recebidos:', files);
  
  try {
    // Atualizar progresso inicial
    if (onProgress) {
      onProgress({
        etapa: 'Iniciando Análise',
        mensagem: 'Preparando arquivos...',
        progresso: 5
      });
    }
    
    // Enviar para backend
    const resultado = await enviarParaBackend(files, onProgress);
    
    return resultado;
    
  } catch (error) {
    console.error('❌ Erro no processamento real:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
} 