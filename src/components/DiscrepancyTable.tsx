
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface DiscrepancyItem {
  id: number;
  produto: string;
  codigo: string;
  entradas: number;
  saidas: number;
  estoqueInicial: number;
  estoqueFinal: number;
  estoqueFinalCalculado: number;
  discrepancia: string;
}

interface DiscrepancyTableProps {
  data: DiscrepancyItem[];
}

const DiscrepancyTable = ({ data }: DiscrepancyTableProps) => {
  const getDiscrepancyBadge = (discrepancia: string) => {
    const variants = {
      'Sem Discrepância': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Compra sem Nota': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Venda sem Nota': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };

    return (
      <Badge className={`${variants[discrepancia as keyof typeof variants]} border`}>
        {discrepancia}
      </Badge>
    );
  };

  if (data.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-dark-500 text-lg">Nenhum produto encontrado</div>
        <div className="text-dark-600 text-sm mt-2">Tente ajustar os filtros de busca</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-6">Resultados da Análise</h3>
        
        <div className="overflow-hidden rounded-xl border border-dark-700/50">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-800/50 border-b border-dark-700/50">
                <th className="text-left p-4 font-semibold text-dark-300">Produto</th>
                <th className="text-left p-4 font-semibold text-dark-300">Código</th>
                <th className="text-right p-4 font-semibold text-dark-300">Entradas</th>
                <th className="text-right p-4 font-semibold text-dark-300">Saídas</th>
                <th className="text-right p-4 font-semibold text-dark-300">Est. Inicial</th>
                <th className="text-right p-4 font-semibold text-dark-300">Est. Final</th>
                <th className="text-right p-4 font-semibold text-dark-300">Est. Calculado</th>
                <th className="text-center p-4 font-semibold text-dark-300">Discrepância</th>
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
                    <div className="font-medium text-foreground">{item.produto}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-mono text-sm text-dark-300">{item.codigo}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-green-400 font-medium">+{item.entradas}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-red-400 font-medium">-{item.saidas}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-dark-300">{item.estoqueInicial}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-dark-300">{item.estoqueFinal}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className={`
                      font-medium
                      ${item.estoqueFinalCalculado !== item.estoqueFinal 
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                      }
                    `}>
                      {item.estoqueFinalCalculado}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {getDiscrepancyBadge(item.discrepancia)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DiscrepancyTable;
