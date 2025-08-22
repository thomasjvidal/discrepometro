import { useState } from 'react';
import { Download, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import DiscrepancyTable from './DiscrepancyTable';
import FilterBar from './FilterBar';
import StatsCard from './StatsCard';

interface DiscrepancyItem {
  id: number;
  produto: string;
  codigo_produto: string;
  total_entradas: number;
  total_saidas: number;
  estoque_inicial_2021: number;
  estoque_final_2021: number;
  tipo_discrepancia: string;
  fonte: string;
}

interface AnalysisResultsProps {
  data: {
    discrepancies: DiscrepancyItem[];
    stats: {
      total: number;
      critical: number;
      warning: number;
      resolved: number;
      progress: number;
    };
    files: Array<{
      name: string;
      type: string;
      size: number;
      status: string;
    }>;
  };
  onExport?: () => void;
  onFilter?: (filter: string) => void;
  onSearch?: (term: string) => void;
  onYearChange?: (year: string) => void;
}

const AnalysisResults = ({
  data,
  onExport,
  onFilter,
  onSearch,
  onYearChange
}: AnalysisResultsProps) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  const handleExport = () => {
    onExport?.();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Resultados da Análise</h2>
          <p className="text-dark-400">Detalhes das discrepâncias encontradas</p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Discrepâncias"
          value={data.stats.total}
          icon={AlertTriangle}
          color="red"
          trend={{
            value: 5,
            label: "vs. último mês"
          }}
        />
        <StatsCard
          title="Críticas"
          value={data.stats.critical}
          icon={XCircle}
          color="red"
          progress={data.stats.critical / data.stats.total * 100}
        />
        <StatsCard
          title="Atenção"
          value={data.stats.warning}
          icon={AlertTriangle}
          color="golden"
          progress={data.stats.warning / data.stats.total * 100}
        />
        <StatsCard
          title="Resolvidas"
          value={data.stats.resolved}
          icon={CheckCircle}
          color="green"
          progress={data.stats.progress}
        />
      </div>

      {/* Main Content */}
      <Card className="glass-effect">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-golden-400">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="discrepancies" className="data-[state=active]:border-b-2 data-[state=active]:border-golden-400">
              Discrepâncias
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:border-b-2 data-[state=active]:border-golden-400">
              Arquivos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Progresso de Resolução</h3>
                  <div className="space-y-4">
                    <Progress value={data.stats.progress} className="h-3" />
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">0%</span>
                      <span className="text-dark-400">100%</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Distribuição por Tipo</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Críticas</span>
                      <Badge variant="destructive">{data.stats.critical}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Atenção</span>
                      <Badge variant="secondary">{data.stats.warning}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Resolvidas</span>
                      <Badge variant="default">{data.stats.resolved}</Badge>
                    </div>
                  </div>
                </Card>
              </div>

              {data.stats.critical > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Existem {data.stats.critical} discrepâncias críticas que requerem atenção imediata.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="discrepancies" className="p-6">
            <div className="space-y-6">
              <FilterBar
                selectedFilter="all"
                onFilterChange={onFilter}
                onSearch={onSearch}
                onYearChange={onYearChange}
              />
              <DiscrepancyTable data={data.discrepancies} />
            </div>
          </TabsContent>

          <TabsContent value="files" className="p-6">
            <div className="space-y-4">
              {data.files.map((file, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-dark-800">
                        <FileText className="w-5 h-5 text-golden-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">{file.name}</h4>
                        <p className="text-sm text-dark-400">
                          {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Badge variant={file.status === 'processed' ? 'default' : 'secondary'}>
                      {file.status === 'processed' ? 'Processado' : 'Em Processamento'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AnalysisResults; 