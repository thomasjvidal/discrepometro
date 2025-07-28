import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Table, FileText, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import UploadArea from '@/components/UploadArea';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const steps = [
  { label: 'Upload do Arquivo', description: 'Enviando arquivo para o servidor' },
  { label: 'Processando Dados', description: 'Analisando conteúdo do arquivo' },
  { label: 'Salvando Resultados', description: 'Armazenando dados no banco' },
  { label: 'Finalizando', description: 'Preparando visualização' }
];

interface DiscrepometroUploadProps {
  onFilesUploaded?: (files: File[]) => void;
}

// Função para detectar tipo de arquivo de forma ULTRA SIMPLES
const detectFileType = (file: File): 'excel' | 'pdf' | 'csv' | 'unknown' => {
  const fileName = file.name.toLowerCase();
  
  console.log(`🔍 DETECÇÃO ULTRA SIMPLES para: ${file.name}`);
  console.log(`   - Nome lowercase: ${fileName}`);
  console.log(`   - Contém .xlsx: ${fileName.indexOf('.xlsx') > -1}`);
  console.log(`   - Contém .xls: ${fileName.indexOf('.xls') > -1}`);
  console.log(`   - Contém .pdf: ${fileName.indexOf('.pdf') > -1}`);
  
  // TESTE DIRETO - forçar Excel se contém .xlsx
  if (fileName.indexOf('.xlsx') > -1) {
    console.log(`   ✅ FORÇANDO EXCEL por .xlsx`);
    return 'excel';
  }
  
  if (fileName.indexOf('.xls') > -1) {
    console.log(`   ✅ FORÇANDO EXCEL por .xls`);
    return 'excel';
  }
  
  if (fileName.indexOf('.xlsb') > -1) {
    console.log(`   ✅ FORÇANDO EXCEL por .xlsb`);
    return 'excel';
  }
  
  if (fileName.indexOf('.csv') > -1) {
    console.log(`   ✅ FORÇANDO CSV por .csv`);
    return 'csv';
  }
  
  if (fileName.indexOf('.pdf') > -1) {
    console.log(`   ✅ FORÇANDO PDF por .pdf`);
    return 'pdf';
  }
  
  console.log(`   ❌ Tipo não reconhecido para: ${fileName}`);
  return 'unknown';
};

// Função para obter ícone baseado no tipo detectado
const getFileIcon = (file: File) => {
  const fileType = detectFileType(file);
  
  console.log(`🎨 Obtendo ícone para ${file.name} - tipo detectado: ${fileType}`);
  
  switch (fileType) {
    case 'excel':
      return { icon: Table, color: 'text-golden-400', label: 'Distribuição' };
    case 'pdf':
      return { icon: FileText, color: 'text-red-400', label: 'Inventário' };
    case 'csv':
      return { icon: Database, color: 'text-blue-400', label: 'Distribuição' };
    default:
      return { icon: FileText, color: 'text-gray-400', label: 'Desconhecido' };
  }
};

const DiscrepometroUpload = ({ onFilesUploaded }: DiscrepometroUploadProps) => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0); // Forçar re-render

  // Limpar qualquer cache quando o componente monta
  useEffect(() => {
    console.log('🔥 DiscrepometroUpload montado - limpando estado');
    setFiles([]);
    setError(null);
    setProgress(0);
    setCurrentStep(0);
    setIsUploading(false);
  }, []);

  const handleFileUpload = (newFiles: File[]) => {
    console.log('🔥 handleFileUpload chamado com:', newFiles.map(f => ({name: f.name, size: f.size, type: f.type})));
    
    // TESTE DIRETO - verificar cada arquivo
    newFiles.forEach(file => {
      console.log(`🧪 TESTE DIRETO para ${file.name}:`);
      console.log(`   - Nome original: ${file.name}`);
      console.log(`   - Nome lowercase: ${file.name.toLowerCase()}`);
      console.log(`   - Inclui .xlsx: ${file.name.toLowerCase().includes('.xlsx')}`);
      console.log(`   - Inclui .xls: ${file.name.toLowerCase().includes('.xls')}`);
      console.log(`   - Tipo detectado: ${detectFileType(file)}`);
    });
    
    // Validar tipos de arquivo
    const validFiles = newFiles.filter(file => {
      const fileType = detectFileType(file);
      const isValid = fileType !== 'unknown';
      
      if (!isValid) {
        console.warn('⚠️ Arquivo não suportado:', file.name);
        toast.error(`Arquivo não suportado: ${file.name}`);
      } else {
        console.log(`✅ Arquivo válido: ${file.name} (${fileType})`);
      }
      
      return isValid;
    });
    
    console.log('🔥 Definindo arquivos:', validFiles.map(f => f.name));
    setFiles(validFiles);
    setError(null);
    
    // Forçar re-render
    setTimeout(() => {
      console.log('🔄 Forçando re-render da interface');
      setForceUpdate(prev => prev + 1);
    }, 100);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Selecione pelo menos um arquivo para upload.");
      return;
    }

    // Validar arquivos mínimos para discrepômetro
    const pdfs = files.filter(f => detectFileType(f) === 'pdf');
    const excels = files.filter(f => detectFileType(f) === 'excel' || detectFileType(f) === 'csv');
    
    console.log(`📁 Validação: ${pdfs.length} PDFs, ${excels.length} Excel/CSV`);
    console.log('📄 PDFs:', pdfs.map(f => f.name));
    console.log('📊 Excel/CSV:', excels.map(f => f.name));
    
    if (pdfs.length < 2) {
      const errorMsg = "São necessários pelo menos 2 PDFs (inventário físico e contábil)";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    if (excels.length < 1) {
      const errorMsg = "É necessário pelo menos 1 arquivo Excel/CSV com distribuição (emitente/destinatário)";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setCurrentStep(0);
    setError(null);

    const toastId = toast.loading("Iniciando upload...");

    try {
      // Se tem callback, chama ele ao invés de processar no backend
      if (onFilesUploaded) {
        console.log('🚀 Usando processador real com callback');
        
        // Simular progresso inicial
        setProgress(10);
        setCurrentStep(0);
          await new Promise(resolve => setTimeout(resolve, 500));
        
        toast.success("Arquivos carregados com sucesso!", { id: toastId });
        onFilesUploaded(files);
        setIsUploading(false);
        return;
      }

      // Processo original para quando não tem callback
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', '1'); // TODO: Pegar do contexto de autenticação
        formData.append('ano', '2024'); // TODO: Permitir seleção do ano

        let endpoint = '';
        const fileType = detectFileType(file);
        
        console.log(`📤 Processando arquivo: ${file.name} (tipo: ${fileType})`);
        
        if (fileType === 'pdf') {
          endpoint = 'process_pdf';
        } else if (fileType === 'csv') {
          endpoint = 'upload_csv';
        } else if (fileType === 'excel') {
          endpoint = 'upload_xlsx';
        } else {
          throw new Error(`Formato de arquivo não suportado: ${file.name}`);
        }

        setCurrentStep(0);
        const response = await fetch(`https://hvjjcegcdivumprqviug.functions.supabase.co/${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4'
        },
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

        const result = await response.json();
      setProgress(100);
      setCurrentStep(3);

        toast.success(`Arquivo ${file.name} processado com sucesso!`, { id: toastId });
      }

      setTimeout(() => {
        setIsUploading(false);
        navigate('/dashboard');
      }, 1200);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar os arquivos.";
      setError(errorMessage);
      toast.error(errorMessage, { id: toastId });
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <Card className="glass-effect p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Upload de Arquivos</h2>
              <p className="text-dark-400">
                Faça upload dos arquivos para análise de discrepâncias fiscais
              </p>
              <div className="text-sm text-dark-500">
                <strong>Requisitos:</strong> 2 PDFs (inventário físico + contábil) + 1+ Excel/CSV (distribuição emitente/destinatário)
              </div>
            </div>
            <UploadArea 
              onFileUpload={handleFileUpload} 
              isUploading={isUploading}
              progress={progress}
              error={error || undefined}
            />
            {isUploading && (
              <div className="space-y-6 pt-6">
                <Progress value={progress} className="w-full h-3" />
                <div className="flex flex-col gap-2 items-center">
                  {steps.map((step, idx) => (
                    <div key={step.label} className={`flex items-center gap-3 text-base ${currentStep === idx ? 'font-bold text-golden-400' : 'text-dark-400'}`}> 
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${currentStep >= idx ? 'bg-golden-400' : 'bg-dark-700'}`}></span>
                      <span>{step.label}</span>
                      <span className="text-xs text-dark-500 ml-2">{step.description}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center text-sm text-dark-400 pt-2">
                  {progress < 100 ? `Processando arquivos... ${progress}%` : 'Análise concluída. Redirecionando para o dashboard...'}
                </div>
              </div>
            )}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleUpload}
                size="lg"
                className="bg-gradient-to-r from-golden-500 to-golden-600 hover:from-golden-600 hover:to-golden-700 text-dark-900 font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 golden-glow"
                disabled={files.length === 0 || isUploading}
              >
                <UploadIcon className="w-5 h-5 mr-2" />
                Analisar Arquivos
              </Button>
            </div>
            {/* Arquivos Carregados */}
            {files.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Arquivos Carregados ({files.length})</h3>
                <div className="space-y-2">
                  {files.map((file, index) => {
                    // SOLUÇÃO FORÇADA - detectar diretamente pelo nome
                    const fileName = file.name.toLowerCase();
                    const isExcelFile = fileName.includes('.xlsx') || fileName.includes('.xls') || fileName.includes('.xlsb');
                    const isPdfFile = fileName.includes('.pdf');
                    const isCsvFile = fileName.includes('.csv');
                    
                    // Forçar tipo baseado na extensão
                    let forcedType = 'unknown';
                    let forcedLabel = 'Desconhecido';
                    let forcedIcon = FileText;
                    let forcedColor = 'text-gray-400';
                    
                    if (isExcelFile) {
                      forcedType = 'EXCEL';
                      forcedLabel = 'Distribuição';
                      forcedIcon = Table;
                      forcedColor = 'text-golden-400';
                    } else if (isPdfFile) {
                      forcedType = 'PDF';
                      forcedLabel = 'Inventário';
                      forcedIcon = FileText;
                      forcedColor = 'text-red-400';
                    } else if (isCsvFile) {
                      forcedType = 'CSV';
                      forcedLabel = 'Distribuição';
                      forcedIcon = Database;
                      forcedColor = 'text-blue-400';
                    }
                    
                    const Icon = forcedIcon;
                    
                    console.log(`🎯 SOLUÇÃO FORÇADA para ${file.name}:`);
                    console.log(`   - Nome: ${fileName}`);
                    console.log(`   - É Excel? ${isExcelFile}`);
                    console.log(`   - É PDF? ${isPdfFile}`);
                    console.log(`   - Tipo forçado: ${forcedType}`);
                    console.log(`   - Label forçado: ${forcedLabel}`);
                    
                    return (
                      <div key={`${index}-${forceUpdate}-${file.name}`} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-dark-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-golden-500/20 flex items-center justify-center">
                            {isExcelFile ? (
                            <Table className="w-4 h-4 text-golden-400" />
                          ) : (
                              <Icon className={`w-4 h-4 ${forcedColor}`} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-dark-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • <span className="text-golden-400">{forcedType}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-golden-400">
                          {forcedLabel}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DiscrepometroUpload; 