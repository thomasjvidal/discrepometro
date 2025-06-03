
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'red' | 'green' | 'golden';
}

const StatsCard = ({ title, value, subtitle, icon: Icon, color }: StatsCardProps) => {
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

  return (
    <Card className="glass-effect p-6 hover:scale-105 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-dark-400 font-medium">{title}</p>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-dark-500">{subtitle}</p>
            )}
          </div>
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
