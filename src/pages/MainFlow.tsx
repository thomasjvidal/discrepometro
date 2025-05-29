import { useState, useCallback } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import DiscrepometroUpload from '@/components/DiscrepometroUpload';
import LoadingAnalysis from '@/components/LoadingAnalysis';
import Dashboard from './Dashboard';
import { processarArquivosPython, verificarStatusServidor } from '../services/pythonProcessor';

type FlowState = 'upload' | 'processing' | 'dashboard';

export default function MainFlow() {
  const [currentFlow, setCurrentFlow] = useState<FlowState>('upload');
  const [processProgress, setProcessProgress] = useState({
    etapa: '',
    progresso: 0,
    mensagem: '',
    detalhes: ''
  });
  const { toast } = useToast();

  const handleFilesUploaded = async (files: File[]) => {
    console.log('🗂️ Arquivos recebidos:', files.length);
    
    if (files.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um arquivo",
        variant: "destructive"
      });
      return;
    }

    // Verificar tipos de arquivo suportados
    const tiposSuportados = ['.pdf', '.xlsx', '.xls', '.xlsb', '.csv'];
    const arquivosInvalidos = files.filter(file => 
      !tiposSuportados.some(tipo => file.name.toLowerCase().endsWith(tipo))
    );

    if (arquivosInvalidos.length > 0) {
      toast({
        title: "Arquivos não suportados",
        description: `Tipos suportados: PDF, XLSX, XLS, XLSB, CSV`,
        variant: "destructive"
      });
      return;
    }

    // Verificar se servidor está online
    setCurrentFlow('processing');
    setProcessProgress({ 
      etapa: 'Verificando servidor', 
      progresso: 10, 
      mensagem: 'Conectando com o servidor...', 
      detalhes: 'Verificando status do processador Python' 
    });

    const servidorOnline = await verificarStatusServidor();
    if (!servidorOnline) {
      toast({
        title: "Servidor offline",
        description: "O servidor de processamento não está disponível",
        variant: "destructive"
      });
      setCurrentFlow('upload');
      return;
    }

    // FASE 2: PROCESSAMENTO PYTHON
    setProcessProgress({ 
      etapa: 'Processando arquivos', 
      progresso: 20, 
      mensagem: 'Enviando arquivos para processamento...', 
      detalhes: `${files.length} arquivo(s) sendo processados` 
    });

    try {
      // Simular progresso durante processamento
      const progressInterval = setInterval(() => {
        setProcessProgress(prev => ({
          ...prev,
          progresso: Math.min(prev.progresso + 10, 90),
          mensagem: prev.progresso < 50 ? 'Lendo PDFs...' : 
                   prev.progresso < 70 ? 'Processando planilhas...' : 
                   'Calculando discrepâncias...'
        }));
      }, 1000);

      const result = await processarArquivosPython(files);
      clearInterval(progressInterval);

      setProcessProgress({ 
        etapa: 'Finalizando', 
        progresso: 100, 
        mensagem: 'Processamento concluído!', 
        detalhes: result.message 
      });

      // FASE 3: DASHBOARD
      toast({
        title: "Sucesso!",
        description: "Arquivos processados com sucesso pelo Python!"
      });
      
      setTimeout(() => {
        setCurrentFlow('dashboard');
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ Erro:', error);
      toast({
        title: "Erro no processamento",
        description: `${error.message}`,
        variant: "destructive"
      });
      setCurrentFlow('upload');
    }
  };

  const renderContent = () => {
    switch (currentFlow) {
      case 'upload':
        return <DiscrepometroUpload onFilesUploaded={handleFilesUploaded} />;
      case 'processing':
        return (
          <LoadingAnalysis 
            etapa={processProgress.etapa}
            progresso={processProgress.progresso}
            mensagem={processProgress.mensagem}
            detalhes={processProgress.detalhes}
          />
        );
      case 'dashboard':
        return <Dashboard />;
      default:
        return <DiscrepometroUpload onFilesUploaded={handleFilesUploaded} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {renderContent()}
      <Toaster />
    </div>
  );
} 