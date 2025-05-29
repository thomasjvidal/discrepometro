import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'red' | 'green' | 'golden';
  trend?: {
    value: number;
    label: string;
  };
  progress?: number;
}

const StatsCard = ({ title, value, subtitle, icon: Icon, color, trend, progress }: StatsCardProps) => {
  const colorVariants = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    golden: 'bg-golden-500/20 text-golden-400 border-golden-500/30'
  };

  const iconColors = {
    blue: 'text-blue-400',
    red: 'text-red-400',
    green: 'text-green-400',
    golden: 'text-golden-400'
  };

  const progressColors = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    golden: 'bg-golden-500'
  };

  return (
    <Card className="glass-effect p-6 hover:scale-105 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm text-dark-400 font-medium">{title}</p>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-dark-500">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs ${trend.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-dark-500">{trend.label}</span>
              </div>
            )}
          </div>
          {progress !== undefined && (
            <div className="mt-2">
              <Progress value={progress} className={`h-2 ${progressColors[color]}`} />
            </div>
          )}
        </div>
        <div className={`
          p-3 rounded-xl border transition-all duration-300
          ${colorVariants[color]}
        `}>
          <Icon className={`w-6 h-6 ${iconColors[color]}`} />
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
