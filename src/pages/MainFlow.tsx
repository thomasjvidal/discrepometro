import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DiscrepometroUpload from '../components/DiscrepometroUpload';
import LoadingAnalysis from '../components/LoadingAnalysis';
import Dashboard from './Dashboard';
import { processarArquivosReais, ProcessamentoProgress } from '../services/realProcessor';

export default function MainFlow() {
  const [currentFlow, setCurrentFlow] = useState<'upload' | 'processing' | 'dashboard'>('upload');
  const [processProgress, setProcessProgress] = useState<ProcessamentoProgress>({
    etapa: '',
    progresso: 0,
    mensagem: '',
    detalhes: ''
  });

  const navigate = useNavigate();

  const handleFilesUploaded = async (files: File[]) => {
    console.log('📁 Arquivos recebidos para processamento:', files.map(f => f.name));
    
    // FASE 1: VALIDAR ARQUIVOS
    const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    const excels = files.filter(f => 
      f.name.toLowerCase().endsWith('.xlsx') || 
      f.name.toLowerCase().endsWith('.xls') ||
      f.name.toLowerCase().endsWith('.csv')
    );
    
    if (pdfs.length < 2) {
      toast.error('São necessários pelo menos 2 PDFs (inventário físico e contábil)');
      return;
    }

    if (excels.length < 1) {
      toast.error('É necessário pelo menos 1 arquivo Excel/CSV com movimentações fiscais');
      return;
    }

    // FASE 2: INICIAR PROCESSAMENTO
    setCurrentFlow('processing');
    
    const toastId = toast.loading('Iniciando processamento...');
    
    try {
      // Usar o processador real com progresso real
      const result = await processarArquivosReais(files, (progress) => {
        setProcessProgress(progress);
        
        // Atualizar toast com progresso
        toast.loading(
          `${progress.etapa}: ${progress.mensagem}`, 
          { id: toastId }
        );
      });
      
      // FASE 3: VERIFICAR RESULTADO
      if (result.success) {
        toast.success(
          `Processamento concluído! ${result.discrepancias.length} discrepâncias encontradas`, 
          { id: toastId }
        );
        
        // Aguardar um pouco para mostrar o resultado final
      setTimeout(() => {
        setCurrentFlow('dashboard');
      }, 1500);
        
      } else {
        throw new Error(result.message);
      }
      
    } catch (error: any) {
      console.error('❌ Erro no processamento:', error);
      
      toast.error(
        `Erro no processamento: ${error.message}`, 
        { id: toastId }
      );
      
      // Voltar para upload em caso de erro
      setTimeout(() => {
      setCurrentFlow('upload');
      }, 2000);
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
            subProgresso={processProgress.subProgresso}
          />
        );
      case 'dashboard':
        return <Dashboard />;
      default:
        return <DiscrepometroUpload onFilesUploaded={handleFilesUploaded} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
      {renderContent()}
      </div>
    </div>
  );
} 