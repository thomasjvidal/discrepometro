
import { useState, useEffect } from 'react';
import { Sparkles, Database, FileText, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const LoadingAnalysis = () => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Processando CSV', description: 'Lendo movimentações e CFOPs', icon: Database },
    { label: 'Analisando PDFs', description: 'Extraindo dados dos inventários', icon: FileText },
    { label: 'Detectando Discrepâncias', description: 'Comparando estoques e movimentações', icon: Sparkles },
    { label: 'Finalizando', description: 'Preparando relatório detalhado', icon: CheckCircle }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1;
        
        // Update step based on progress
        if (newProgress <= 25) setCurrentStep(0);
        else if (newProgress <= 50) setCurrentStep(1);
        else if (newProgress <= 75) setCurrentStep(2);
        else setCurrentStep(3);
        
        return newProgress > 100 ? 100 : newProgress;
      });
    }, 30);

    return () => clearInterval(timer);
  }, []);

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
                Analisando Arquivos
              </h2>
              <p className="text-dark-400">
                Processando dados e identificando discrepâncias...
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-4">
              <Progress value={progress} className="h-3 bg-dark-800" />
              <div className="text-2xl font-bold text-golden-400">
                {progress}%
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div
                    key={index}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl transition-all duration-500
                      ${isActive 
                        ? 'bg-golden-500/20 border border-golden-500/30' 
                        : isCompleted 
                        ? 'bg-green-500/10 border border-green-500/20' 
                        : 'bg-dark-800/30 border border-dark-700/50'
                      }
                    `}
                  >
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500
                      ${isActive 
                        ? 'bg-golden-500 text-dark-900 golden-glow' 
                        : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-dark-700 text-dark-400'
                      }
                    `}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className={`
                        font-semibold transition-colors duration-500
                        ${isActive || isCompleted ? 'text-foreground' : 'text-dark-500'}
                      `}>
                        {step.label}
                      </h3>
                      <p className={`
                        text-sm transition-colors duration-500
                        ${isActive ? 'text-golden-300' : isCompleted ? 'text-green-300' : 'text-dark-600'}
                      `}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoadingAnalysis;
