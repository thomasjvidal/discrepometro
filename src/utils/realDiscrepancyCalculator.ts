import { ExcelMovimentacao } from './realExcelReader';
import { PDFInventario } from './realPdfReader';

export interface DiscrepanciaReal {
  produto: string;
  codigo: string;
  cfop: string;
  valor_unitario: number;
  valor_total: number;
  entradas: number;
  saidas: number;
  est_inicial: number;
  est_final: number;
  est_calculado: number;
  est_fisico?: number;
  est_contabil?: number;
  discrepancia_tipo: 'Sem Discrepância' | 'Estoque Excedente' | 'Estoque Faltante' | 'Divergência Física/Contábil';
  discrepancia_valor: number;
  observacoes: string;
  ano?: number;
  user_id?: string;
  // Novos campos para Top 5 mais vendidos
  fonte_inventario_fisico?: number;
  fonte_inventario_contabil?: number;
  ranking_vendas?: number;
}

export function calcularDiscrepanciasReais(
  movimentacoes: ExcelMovimentacao[],
  inventarioFisico: PDFInventario[],
  inventarioContabil: PDFInventario[]
): DiscrepanciaReal[] {
  console.log('🧮 INICIANDO CÁLCULO REAL DE DISCREPÂNCIAS');
  console.log(`📊 Movimentações Excel: ${movimentacoes.length}`);
  console.log(`📄 Inventário Físico: ${inventarioFisico.length}`);
  console.log(`📄 Inventário Contábil: ${inventarioContabil.length}`);
  
  const discrepancias: DiscrepanciaReal[] = [];
  
  // Criar maps para busca otimizada
  const mapFisico = new Map(inventarioFisico.map(item => [item.codigo, item]));
  const mapContabil = new Map(inventarioContabil.map(item => [item.codigo, item]));
  
  // Processar cada movimentação do Excel
  for (const mov of movimentacoes) {
    console.log(`🔍 Analisando produto: ${mov.codigo} - ${mov.produto}`);
    
    // Buscar correspondentes nos inventários
    const fisico = mapFisico.get(mov.codigo);
    const contabil = mapContabil.get(mov.codigo);
    
    // Calcular estoque teórico baseado na movimentação
    const estoqueCalculado = mov.est_inicial + mov.entradas - mov.saidas;
    
    // Determinar estoque real prioritariamente do físico
    const estoqueReal = fisico?.quantidade || contabil?.quantidade || mov.est_final;
    
    // Calcular discrepância
    const discrepanciaValor = Math.abs(estoqueReal - estoqueCalculado);
    
    // Determinar tipo de discrepância
    let tipo: DiscrepanciaReal['discrepancia_tipo'] = 'Sem Discrepância';
    let observacoes = '';
    
    // Verificar divergência entre físico e contábil
    if (fisico && contabil) {
      const divergenciaFisicoContabil = Math.abs(fisico.quantidade - contabil.quantidade);
      if (divergenciaFisicoContabil > 0) {
        tipo = 'Divergência Física/Contábil';
        observacoes += `Físico: ${fisico.quantidade}, Contábil: ${contabil.quantidade}. `;
      }
    }
    
    // Se não há divergência física/contábil, verificar outras discrepâncias
    if (tipo === 'Sem Discrepância') {
      if (estoqueReal > estoqueCalculado) {
        tipo = 'Estoque Excedente';
        observacoes += `Excesso de ${estoqueReal - estoqueCalculado} unidades. `;
      } else if (estoqueReal < estoqueCalculado) {
        tipo = 'Estoque Faltante';
        observacoes += `Falta de ${estoqueCalculado - estoqueReal} unidades. `;
      }
    }
    
    // Adicionar informações sobre fontes
    if (fisico) observacoes += 'Inventário físico encontrado. ';
    if (contabil) observacoes += 'Inventário contábil encontrado. ';
    if (!fisico && !contabil) observacoes += 'Baseado apenas na movimentação Excel. ';
    
    // Calcular valores (simulados - em produção, viria de uma tabela de preços)
    const valorUnitario = calcularValorUnitario(mov.codigo, mov.produto);
    const valorTotal = valorUnitario * mov.entradas;
    
    const discrepancia: DiscrepanciaReal = {
      produto: mov.produto,
      codigo: mov.codigo,
      cfop: determinarCFOP(mov),
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      entradas: mov.entradas,
      saidas: mov.saidas,
      est_inicial: mov.est_inicial,
      est_final: estoqueReal,
      est_calculado: estoqueCalculado,
      est_fisico: fisico?.quantidade,
      est_contabil: contabil?.quantidade,
      discrepancia_tipo: tipo,
      discrepancia_valor: discrepanciaValor,
      observacoes: observacoes.trim(),
      ano: new Date().getFullYear(),
      user_id: 'sistema_real'
    };
    
    discrepancias.push(discrepancia);
    
    console.log(`✅ ${mov.codigo}: ${tipo} (Dif: ${discrepanciaValor})`);
  }
  
  // Verificar produtos que existem apenas nos inventários (não no Excel)
  const codigosExcel = new Set(movimentacoes.map(m => m.codigo));
  
  // Produtos apenas no inventário físico
  for (const itemFisico of inventarioFisico) {
    if (!codigosExcel.has(itemFisico.codigo)) {
      const itemContabil = mapContabil.get(itemFisico.codigo);
      
      const discrepancia: DiscrepanciaReal = {
        produto: itemFisico.produto,
        codigo: itemFisico.codigo,
        cfop: '1102',
        valor_unitario: 0,
        valor_total: 0,
        entradas: 0,
        saidas: 0,
        est_inicial: 0,
        est_final: itemFisico.quantidade,
        est_calculado: 0,
        est_fisico: itemFisico.quantidade,
        est_contabil: itemContabil?.quantidade,
        discrepancia_tipo: 'Estoque Excedente',
        discrepancia_valor: itemFisico.quantidade,
        observacoes: 'Produto encontrado apenas no inventário físico',
        ano: new Date().getFullYear(),
        user_id: 'sistema_real'
      };
      
      discrepancias.push(discrepancia);
      console.log(`🆕 Apenas físico: ${itemFisico.codigo}`);
    }
  }
  
  // Produtos apenas no inventário contábil
  for (const itemContabil of inventarioContabil) {
    if (!codigosExcel.has(itemContabil.codigo) && !mapFisico.has(itemContabil.codigo)) {
      const discrepancia: DiscrepanciaReal = {
        produto: itemContabil.produto,
        codigo: itemContabil.codigo,
        cfop: '1102',
        valor_unitario: 0,
        valor_total: 0,
        entradas: 0,
        saidas: 0,
        est_inicial: 0,
        est_final: itemContabil.quantidade,
        est_calculado: 0,
        est_fisico: undefined,
        est_contabil: itemContabil.quantidade,
        discrepancia_tipo: 'Estoque Excedente',
        discrepancia_valor: itemContabil.quantidade,
        observacoes: 'Produto encontrado apenas no inventário contábil',
        ano: new Date().getFullYear(),
        user_id: 'sistema_real'
      };
      
      discrepancias.push(discrepancia);
      console.log(`🆕 Apenas contábil: ${itemContabil.codigo}`);
    }
  }
  
  // Estatísticas finais
  const totalProdutos = discrepancias.length;
  const comDiscrepancia = discrepancias.filter(d => d.discrepancia_tipo !== 'Sem Discrepância').length;
  const valorTotalDiscrepancias = discrepancias.reduce((sum, d) => sum + d.discrepancia_valor, 0);
  
  console.log(`📊 CÁLCULO CONCLUÍDO:`);
  console.log(`   • Total de produtos: ${totalProdutos}`);
  console.log(`   • Com discrepâncias: ${comDiscrepancia}`);
  console.log(`   • Valor total das discrepâncias: ${valorTotalDiscrepancias}`);
  
  return discrepancias;
}

function calcularValorUnitario(codigo: string, produto: string): number {
  // Em produção real, isso consultaria uma tabela de preços
  // Por enquanto, simular baseado no código/produto
  
  if (produto.toLowerCase().includes('nescau')) return 8.50;
  if (produto.toLowerCase().includes('chocolate') || produto.toLowerCase().includes('choc')) return 4.20;
  if (produto.toLowerCase().includes('wafer')) return 3.80;
  if (produto.toLowerCase().includes('lacta')) return 5.90;
  if (produto.toLowerCase().includes('ferrero')) return 12.50;
  
  // Valor padrão baseado no código
  const codigoNum = parseInt(codigo) || 1;
  return 5.0 + (codigoNum % 10);
}

function determinarCFOP(movimentacao: ExcelMovimentacao): string {
  // CFOPs básicos baseados no tipo de movimentação
  if (movimentacao.entradas > movimentacao.saidas) {
    return '1102, 5102'; // Compra para comercialização
  } else {
    return '5102, 6102'; // Venda de mercadoria
  }
} 