import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DiscrepancyItem {
  id: number;
  produto: string;
  codigo: string;
  entradas: number;
  saidas: number;
  est_inicial: number;
  est_final: number;
  est_calculado: number;
  discrepancia_tipo: string;
  observacoes: string;
}

interface DiscrepancyTableProps {
  data: DiscrepancyItem[];
}

const ITEMS_PER_PAGE = 50;

const DiscrepancyTable = ({ data }: DiscrepancyTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = data.slice(startIndex, endIndex);

  const getDiscrepancyBadge = (discrepancia: string) => {
    const variants = {
      'Sem Discrepância': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Estoque Excedente': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Estoque Faltante': 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    return (
      <Badge className={`${variants[discrepancia as keyof typeof variants] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'} border`}>
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
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-foreground">Resultados da Análise</h3>
          <div className="text-sm text-dark-400">
            Mostrando {startIndex + 1}-{Math.min(endIndex, data.length)} de {data.length} itens
          </div>
        </div>
        
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
              {currentData.map((item, index) => (
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
                    <div className="text-dark-300">{item.est_inicial}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-dark-300">{item.est_final}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className={`
                      font-medium
                      ${item.est_final !== item.est_calculado
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                      }
                    `}>
                      {item.est_calculado}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {getDiscrepancyBadge(item.discrepancia_tipo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <div className="text-sm text-dark-400">
            Página {currentPage} de {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DiscrepancyTable;
