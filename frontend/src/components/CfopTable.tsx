
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useCfopMetrics } from '@/hooks/useCfopMetrics';

const CfopTable = () => {
  const { data, loading, error, refetch } = useCfopMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <Card className="glass-effect p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-golden-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-dark-300">Carregando dados de CFOP...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-effect p-8">
        <div className="text-center space-y-4">
          <div className="text-red-400">Erro ao carregar dados: {error}</div>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="glass-effect p-8">
        <div className="text-center space-y-4">
          <div className="text-dark-500 text-lg">Nenhum dado de CFOP encontrado</div>
          <div className="text-dark-600 text-sm">Os dados aparecerão aqui após o processamento dos arquivos</div>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-effect">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">Métricas CFOP</h3>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
        
        <div className="overflow-hidden rounded-xl border border-dark-700/50">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-800/50 border-b border-dark-700/50">
                <th className="text-left p-4 font-semibold text-dark-300">CFOP</th>
                <th className="text-right p-4 font-semibold text-dark-300">Valor</th>
                <th className="text-center p-4 font-semibold text-dark-300">Data</th>
                <th className="text-center p-4 font-semibold text-dark-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr
                  key={item.id}
                  className={`
                    border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors duration-200
                    ${index % 2 === 0 ? 'bg-dark-900/20' : 'bg-transparent'}
                  `}
                >
                  <td className="p-4">
                    <Badge variant="outline" className="bg-golden-500/20 text-golden-400 border-golden-500/30">
                      {item.cfop}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-mono text-green-400 font-medium">
                      {formatCurrency(item.valor)}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="text-dark-300 text-sm">
                      {formatDate(item.created_at)}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
                      Processado
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm text-dark-400 text-center">
          {data.length} registro(s) encontrado(s) • Ordenado por data (mais recente)
        </div>
      </div>
    </Card>
  );
};

export default CfopTable;
