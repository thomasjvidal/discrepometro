
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DiscrepometroVisual from '@/components/DiscrepometroVisual';
import StatsCard from '@/components/StatsCard';
import { useAnaliseDiscrepancia } from '@/hooks/useAnaliseDiscrepancia';

const DiscrepometroFiscal = () => {
  const { data } = useAnaliseDiscrepancia();

  // Agrupar dados por produto para estatísticas
  const groupedProducts = data.reduce((acc, item) => {
    const existing = acc.find(group => group.produto === item.produto);
    if (existing) {
      existing.cfops.push(item.cfop);
    } else {
      acc.push({
        produto: item.produto,
        cfops: [item.cfop]
      });
    }
    return acc;
  }, [] as { produto: string; cfops: string[] }[]);

  const stats = {
    totalProdutos: groupedProducts.length,
    comMultiplosCfops: groupedProducts.filter(group => [...new Set(group.cfops)].length > 1).length,
    comPotencialErro: groupedProducts.filter(group => {
      const uniqueCfops = [...new Set(group.cfops)];
      return uniqueCfops.some(cfop => cfop.startsWith('1') || cfop.startsWith('2')) &&
             uniqueCfops.some(cfop => cfop.startsWith('5') || cfop.startsWith('6'));
    }).length,
    percentualConformidade: groupedProducts.length > 0 ? 
      Math.round(((groupedProducts.length - groupedProducts.filter(group => [...new Set(group.cfops)].length > 1).length) / groupedProducts.length) * 100) : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-white/70 backdrop-blur-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Análise Fiscal – Discrepômetro
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Monitoramento inteligente de discrepâncias fiscais em tempo real
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Produtos"
            value={stats.totalProdutos.toString()}
            icon={BarChart3}
            color="blue"
          />
          <StatsCard
            title="Múltiplos CFOPs"
            value={stats.comMultiplosCfops.toString()}
            icon={AlertTriangle}
            color="golden"
          />
          <StatsCard
            title="Potencial Erro"
            value={stats.comPotencialErro.toString()}
            icon={AlertTriangle}
            color="red"
          />
          <StatsCard
            title="Conformidade"
            value={`${stats.percentualConformidade}%`}
            subtitle={`${stats.totalProdutos - stats.comMultiplosCfops} produtos normais`}
            icon={CheckCircle}
            color="green"
          />
        </div>

        {/* Discrepômetro Visual */}
        <DiscrepometroVisual />
      </div>
    </div>
  );
};

export default DiscrepometroFiscal;
