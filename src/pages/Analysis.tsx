import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Database, FileText, CheckCircle, FileSpreadsheet, Calculator } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

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

  // Simular processamento real
  useEffect(() => {
    const steps = [
      { etapa: 'Lendo PDFs', mensagem: 'Extraindo dados dos inventários físico e contábil', duracao: 3000 },
      { etapa: 'Processando Excel', mensagem: 'Lendo movimentações fiscais e CFOPs', duracao: 4000 },
      { etapa: 'Calculando Discrepâncias', mensagem: 'Cruzando dados e identificando diferenças', duracao: 5000 },
      { etapa: 'Finalizando', mensagem: 'Salvando resultados no banco de dados', duracao: 2000 }
    ];

    let currentStepIndex = 0;

    const processStep = () => {
      if (currentStepIndex < steps.length) {
        const step = steps[currentStepIndex];
        setEtapa(step.etapa);
        setMensagem(step.mensagem);
        setCurrentStep(currentStepIndex);
        setProgresso((currentStepIndex / steps.length) * 100);

        setTimeout(() => {
          currentStepIndex++;
          processStep();
        }, step.duracao);
      } else {
        // Processamento concluído
        setEtapa('Análise Concluída!');
        setMensagem('Redirecionando para o dashboard...');
        setProgresso(100);
        
        toast({
          title: "Análise concluída com sucesso!",
          description: "Resultados disponíveis no dashboard",
        });

        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    };

    processStep();
  }, [navigate]);

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
                  <span className="text-dark-500">Arquivos:</span>
                  <span className="text-dark-300 ml-2">2 PDFs + 1 Excel</span>
                </div>
                <div>
                  <span className="text-dark-500">Tempo estimado:</span>
                  <span className="text-dark-300 ml-2">~14 segundos</span>
                </div>
                <div>
                  <span className="text-dark-500">Etapa atual:</span>
                  <span className="text-golden-400 ml-2">{etapa}</span>
                </div>
                <div>
                  <span className="text-dark-500">Status:</span>
                  <span className="text-green-400 ml-2">Processando</span>
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