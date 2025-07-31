import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Database, FileText, CheckCircle, FileSpreadsheet, Calculator } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { processarArquivosReais, ProcessamentoProgress } from '@/services/realProcessor';

interface AnalysisProps {
  etapa?: string;
  progresso?: number;
  mensagem?: string;
  detalhes?: string;
}

const Analysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const [etapa, setEtapa] = useState('Iniciando análise...');
  const [mensagem, setMensagem] = useState('Preparando arquivos para processamento');
  const [detalhes, setDetalhes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tempoInicio, setTempoInicio] = useState<number | null>(null);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);

  // Processar arquivos reais
  useEffect(() => {
    const files = location.state?.files;
    
    if (!files) {
      toast({
        title: "Erro: Nenhum arquivo encontrado",
        description: "Volte para a página de upload e selecione os arquivos.",
        variant: "destructive"
      });
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    const processarArquivos = async () => {
      setIsProcessing(true);
      setTempoInicio(Date.now());
      
      // Timer para atualizar tempo decorrido
      const timerInterval = setInterval(() => {
        if (tempoInicio) {
          const decorrido = Math.floor((Date.now() - tempoInicio) / 1000);
          setTempoDecorrido(decorrido);
        }
      }, 1000);
      
      // TIMEOUT DE SEGURANÇA (5 minutos)
      const timeoutId = setTimeout(() => {
        console.error('⏰ Timeout de segurança atingido (5 minutos)');
        setEtapa('Timeout - Processamento muito longo');
        setMensagem('O processamento está demorando muito. Tente com arquivos menores.');
        setIsProcessing(false);
        clearInterval(timerInterval);
        
        toast({
          title: "Timeout de processamento",
          description: "O processamento está demorando muito. Tente com arquivos menores ou verifique se os arquivos estão corretos.",
          variant: "destructive"
        });
      }, 5 * 60 * 1000); // 5 minutos
      
      try {
        console.log('🚀 INICIANDO PROCESSAMENTO REAL...');
        console.log('📁 Arquivos recebidos:', {
          pdfs: files.pdfs?.map(f => f.name),
          excels: files.excels?.map(f => f.name),
          csvs: files.csvs?.map(f => f.name)
        });

        // Combinar todos os arquivos
        const todosArquivos = [
          ...(files.pdfs || []),
          ...(files.excels || []),
          ...(files.csvs || [])
        ];

        // Processar arquivos reais
        const resultado = await processarArquivosReais(todosArquivos, (progress: ProcessamentoProgress) => {
          setEtapa(progress.etapa);
          setMensagem(progress.mensagem);
          setDetalhes(progress.detalhes || '');
          setProgresso(progress.progresso);
          
          // Atualizar step baseado no progresso
          if (progress.progresso < 25) setCurrentStep(0);
          else if (progress.progresso < 50) setCurrentStep(1);
          else if (progress.progresso < 75) setCurrentStep(2);
          else setCurrentStep(3);
        });

        // Limpar timeout se chegou até aqui
        clearTimeout(timeoutId);
        clearInterval(timerInterval);

        if (resultado.success) {
          setEtapa('Análise Concluída!');
          setMensagem(`Processamento finalizado: ${resultado.totalProcessados} produtos analisados`);
          setProgresso(100);
          setCurrentStep(3);
          
          toast({
            title: "Análise concluída com sucesso!",
            description: `${resultado.totalProcessados} produtos processados em ${Math.round(resultado.tempoProcessamento / 1000)}s`,
          });

          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          throw new Error(resultado.message);
        }
      } catch (error) {
        // Limpar timeout em caso de erro
        clearTimeout(timeoutId);
        clearInterval(timerInterval);
        
        console.error('❌ Erro no processamento:', error);
        setEtapa('Erro no Processamento');
        setMensagem('Ocorreu um erro durante a análise');
        setDetalhes(error instanceof Error ? error.message : 'Erro desconhecido');
        
        toast({
          title: "Erro no processamento",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive"
        });

        setTimeout(() => {
          navigate('/');
        }, 5000);
      } finally {
        setIsProcessing(false);
      }
    };

    processarArquivos();
  }, [navigate, location.state]);

  const steps = [
    { 
      label: 'Lendo PDFs', 
      description: 'Extraindo dados dos inventários físico e contábil', 
      icon: FileText 
    },
    { 
      label: 'Processando Excel', 
      description: 'Lendo movimentações fiscais e CFOPs', 
      icon: FileSpreadsheet 
    },
    { 
      label: 'Calculando Discrepâncias', 
      description: 'Cruzando dados e identificando diferenças', 
      icon: Calculator 
    },
    { 
      label: 'Finalizando', 
      description: 'Salvando resultados no banco de dados', 
      icon: CheckCircle 
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl mx-auto">
        <Card className="glass-effect p-8 text-center">
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-golden-400 to-golden-600 flex items-center justify-center animate-pulse-golden">
                <Sparkles className="w-10 h-10 text-dark-900" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-golden-400 to-golden-600 bg-clip-text text-transparent">
                {etapa}
              </h2>
              <p className="text-dark-400">
                {mensagem}
              </p>
              {detalhes && (
                <p className="text-sm text-dark-500">
                  {detalhes}
                </p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progresso} className="h-3" />
              <p className="text-sm text-dark-500">
                {Math.round(progresso)}% concluído
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 ${
                      isActive 
                        ? 'bg-golden-500/20 border border-golden-500/30' 
                        : isCompleted 
                        ? 'bg-green-500/10 border border-green-500/20' 
                        : 'bg-dark-700/50 border border-dark-600/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      isActive 
                        ? 'bg-golden-500 text-dark-900' 
                        : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-dark-600 text-dark-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className={`font-medium ${
                        isActive ? 'text-golden-400' : isCompleted ? 'text-green-400' : 'text-dark-300'
                      }`}>
                        {step.label}
                      </h3>
                      <p className="text-sm text-dark-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Processing Details */}
            <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700/50">
              <h4 className="font-medium text-dark-300 mb-2">Detalhes do Processamento</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-dark-500">Status:</span>
                  <span className="ml-2 text-golden-400 font-medium">
                    {isProcessing ? 'Processando...' : 'Concluído'}
                  </span>
                </div>
                <div>
                  <span className="text-dark-500">Tempo decorrido:</span>
                  <span className="ml-2 text-golden-400 font-medium">
                    {tempoDecorrido}s
                  </span>
                </div>
                <div>
                  <span className="text-dark-500">Progresso:</span>
                  <span className="ml-2 text-golden-400 font-medium">
                    {Math.round(progresso)}%
                  </span>
                </div>
                <div>
                  <span className="text-dark-500">Etapa atual:</span>
                  <span className="ml-2 text-golden-400 font-medium">
                    {currentStep + 1}/4
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analysis; 