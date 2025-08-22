export interface ProcessResponse {
  success: boolean;
  message: string;
  output: string;
  timestamp: string;
  error?: string;
}

export async function processFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  // a URL deve bater com o host:porta onde seu backend está rodando
  const response = await fetch('http://localhost:8000/process_file', {
    method: 'POST',
    body: formData,
    // NÃO defina Content-Type aqui — o browser ajusta multipart/form-data
  });

  // tratativa de erro caso retorne HTML ou status != 2xx
  if (!response.ok) {
    const texto = await response.text();
    throw new Error(`Erro HTTP ${response.status}: ${texto}`);
  }

  // se chegou aqui, é JSON válido
  return await response.json();
}

export async function processarArquivosPython(files: File[]): Promise<ProcessResponse> {
  console.log('🐍 Iniciando processamento Python com', files.length, 'arquivos');
  
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
    console.log(`📎 Adicionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  });

  try {
    const response = await fetch('http://localhost:8000/process_files', {
      method: 'POST',
      body: formData
      // NÃO defina Content-Type aqui — o browser ajusta multipart/form-data
    });

    // tratativa de erro caso retorne HTML ou status != 2xx
    if (!response.ok) {
      const texto = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${texto}`);
    }

    const result = await response.json();
    console.log('✅ Processamento Python concluído');
    return result;

  } catch (error) {
    console.error('❌ Erro no processamento Python:', error);
    throw error;
  }
}

export async function verificarStatusServidor(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8000/status');
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.status === 'online';
  } catch (error) {
    console.error('❌ Servidor offline:', error);
    return false;
  }
} 