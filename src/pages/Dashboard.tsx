import React, { useState, useEffect, useMemo } from 'react';
import { FileText, TrendingUp, AlertTriangle, DollarSign, Filter, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@supabase/supabase-js';
import { DiscrepanciaReal } from '../utils/realDiscrepancyCalculator';

const supabaseUrl = 'https://hvjjcegcdivumprqviug.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4';

const supabase = createClient(supabaseUrl, supabaseKey);

export default function Dashboard() {
  // Estados
  const [discrepancias, setDiscrepancias] = useState<DiscrepanciaReal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Buscar dados reais do Supabase
  useEffect(() => {
    buscarDiscrepanciasSupabase();
  }, []);

  const buscarDiscrepanciasSupabase = async () => {
    console.log('🔍 BUSCANDO DADOS REAIS DO SUPABASE');
    setCarregando(true);
    setErro(null);

    try {
      const { data, error } = await supabase
        .from('analise_discrepancia')
        .select('*')
        .order('discrepancia_valor', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar dados: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} registros encontrados no Supabase`);
      setDiscrepancias(data || []);

    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  // Filtrar dados
  const dadosFiltrados = useMemo(() => {
    return discrepancias.filter(item => {
      const matchTipo = filtroTipo === 'todos' || item.discrepancia_tipo === filtroTipo;
      const matchTexto = filtroTexto === '' || 
        item.produto.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        item.codigo.toLowerCase().includes(filtroTexto.toLowerCase());
      
      return matchTipo && matchTexto;
    });
  }, [discrepancias, filtroTipo, filtroTexto]);

  // Paginação
  const dadosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return dadosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [dadosFiltrados, paginaAtual]);

  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const total = discrepancias.length;
    const comDiscrepancia = discrepancias.filter(d => d.discrepancia_tipo !== 'Sem Discrepância').length;
    const valorTotal = discrepancias.reduce((sum, d) => sum + (d.valor_total || 0), 0);
    const valorDiscrepancias = discrepancias.reduce((sum, d) => sum + d.discrepancia_valor, 0);

    const porTipo = {
      'Sem Discrepância': discrepancias.filter(d => d.discrepancia_tipo === 'Sem Discrepância').length,
      'Estoque Excedente': discrepancias.filter(d => d.discrepancia_tipo === 'Estoque Excedente').length,
      'Estoque Faltante': discrepancias.filter(d => d.discrepancia_tipo === 'Estoque Faltante').length,
      'Divergência Física/Contábil': discrepancias.filter(d => d.discrepancia_tipo === 'Divergência Física/Contábil').length
    };

    return {
      total,
      comDiscrepancia,
      percentualComDiscrepancia: total > 0 ? (comDiscrepancia / total) * 100 : 0,
      valorTotal,
      valorDiscrepancias,
      porTipo
    };
  }, [discrepancias]);

  const getBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'Sem Discrepância': return 'outline';
      case 'Estoque Excedente': return 'default';
      case 'Estoque Faltante': return 'destructive';
      case 'Divergência Física/Contábil': return 'secondary';
      default: return 'outline';
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Tela de carregamento
  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dados reais do Supabase...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de erro
  if (erro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dados</h3>
              <p className="text-gray-600 mb-4">{erro}</p>
              <Button onClick={buscarDiscrepanciasSupabase}>
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Discrepâncias</h1>
            <p className="text-gray-600 mt-2">
              Análise real baseada em dados do Supabase • {discrepancias.length} produtos analisados
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={buscarDiscrepanciasSupabase} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.total.toLocaleString('pt-BR')}</div>
              <p className="text-xs text-muted-foreground">Produtos analisados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Discrepâncias</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.comDiscrepancia.toLocaleString('pt-BR')}</div>
              <p className="text-xs text-muted-foreground">
                {estatisticas.percentualComDiscrepancia.toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarMoeda(estatisticas.valorTotal)}</div>
              <p className="text-xs text-muted-foreground">Movimentação total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impacto Discrepâncias</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.valorDiscrepancias.toLocaleString('pt-BR')}</div>
              <p className="text-xs text-muted-foreground">Unidades divergentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por produto ou código..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full sm:w-64">
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de discrepância" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="Sem Discrepância">Sem Discrepância</SelectItem>
                    <SelectItem value="Estoque Excedente">Estoque Excedente</SelectItem>
                    <SelectItem value="Estoque Faltante">Estoque Faltante</SelectItem>
                    <SelectItem value="Divergência Física/Contábil">Divergência Física/Contábil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              Mostrando {dadosFiltrados.length} de {discrepancias.length} produtos
            </div>
          </CardContent>
        </Card>

        {/* Tabela de dados */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento das Discrepâncias</CardTitle>
            <CardDescription>Dados extraídos com ExcelJS e pdf-parse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Est. Calculado</TableHead>
                    <TableHead className="text-right">Est. Real</TableHead>
                    <TableHead className="text-right">Discrepância</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosPaginados.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.codigo}</TableCell>
                      <TableCell className="max-w-48 truncate">{item.produto}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(item.discrepancia_tipo)}>
                          {item.discrepancia_tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.est_calculado.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-right">{item.est_final.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.discrepancia_valor.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">{formatarMoeda(item.valor_unitario)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Discrepância</DialogTitle>
                              <DialogDescription>
                                {item.codigo} - {item.produto}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                              <div>
                                <h4 className="font-semibold mb-2">Movimentação</h4>
                                <div className="space-y-1 text-sm">
                                  <div>Entradas: {item.entradas}</div>
                                  <div>Saídas: {item.saidas}</div>
                                  <div>Estoque Inicial: {item.est_inicial}</div>
                                  <div>Estoque Calculado: {item.est_calculado}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Inventários</h4>
                                <div className="space-y-1 text-sm">
                                  <div>Físico: {item.est_fisico || 'N/A'}</div>
                                  <div>Contábil: {item.est_contabil || 'N/A'}</div>
                                  <div>Real (Final): {item.est_final}</div>
                                  <div>CFOP: {item.cfop}</div>
                                </div>
                              </div>
                              <div className="col-span-2">
                                <h4 className="font-semibold mb-2">Observações</h4>
                                <p className="text-sm text-gray-600">{item.observacoes}</p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Página {paginaAtual} de {totalPaginas}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                    disabled={paginaAtual === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaAtual === totalPaginas}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
