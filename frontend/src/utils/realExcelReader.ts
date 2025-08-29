import * as XLSX from 'xlsx';

export interface ExcelMovimentacao {
  codigo: string;
  produto: string;
  cfop: string;
  entradas: number;
  saidas: number;
  est_inicial: number;
  est_final: number;
  valor_unitario?: number;
  valor_total?: number;
  data_movimento?: string;
}

export interface ExcelProcessamentoProgress {
  planilhaAtual: number;
  totalPlanilhas: number;
  linhasProcessadas: number;
  movimentacoesEncontradas: number;
}

export async function lerExcelReal(
  file: File,
  onProgress?: (progress: ExcelProcessamentoProgress) => void
): Promise<ExcelMovimentacao[]> {
  console.log('📊 Iniciando leitura REAL do Excel:', file.name, 'Tamanho:', file.size);
  
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    console.log(`📊 Excel carregado REALMENTE: ${workbook.SheetNames.length} planilhas encontradas`);
    console.log(`📋 Nomes das planilhas:`, workbook.SheetNames);
    
    const movimentacoes: ExcelMovimentacao[] = [];
    let linhasProcessadas = 0;
    
    // Processar cada planilha
    for (let planilhaIndex = 0; planilhaIndex < workbook.SheetNames.length; planilhaIndex++) {
      const nomePlanilha = workbook.SheetNames[planilhaIndex];
      const worksheet = workbook.Sheets[nomePlanilha];
      
      // Atualizar progresso
      if (onProgress) {
        onProgress({
          planilhaAtual: planilhaIndex + 1,
          totalPlanilhas: workbook.SheetNames.length,
          linhasProcessadas,
          movimentacoesEncontradas: movimentacoes.length
        });
      }
      
      console.log(`📄 Processando planilha REAL: ${nomePlanilha}`);
      
      // Ler todas as linhas da planilha
      const todasLinhas = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as string[][];
      
      if (todasLinhas.length === 0) {
        console.log(`⚠️ Planilha ${nomePlanilha} está vazia, pulando...`);
        continue;
      }
      
      console.log(`📋 Planilha ${nomePlanilha}: ${todasLinhas.length} linhas encontradas`);
      
      // Mostrar as primeiras 3 linhas para debug
      console.log(`🔍 PRIMEIRAS 3 LINHAS DA PLANILHA ${nomePlanilha}:`);
      for (let i = 0; i < Math.min(3, todasLinhas.length); i++) {
        console.log(`   Linha ${i + 1}:`, todasLinhas[i]);
      }
      
      // 1. IDENTIFICAR LINHA DO CABEÇALHO REAL
      const linhaCabecalho = identificarLinhaCabecalho(todasLinhas);
      const cabecalho = todasLinhas[linhaCabecalho];
      
      console.log(`📋 Cabeçalho encontrado na linha ${linhaCabecalho + 1}:`, cabecalho);
      
      // 2. MAPEAR COLUNAS POR SIMILARIDADE
      const indices = mapearColunasPorSimilaridade(cabecalho);
      
      // Validar se encontrou todas as colunas essenciais
      if (indices.cfop < 0 || indices.codigo < 0 || indices.quantidade < 0) {
        console.error(`❌ Planilha ${nomePlanilha} não possui todas as colunas essenciais:`);
        console.error(`   - CFOP: ${indices.cfop >= 0 ? '✅' : '❌'}`);
        console.error(`   - Código: ${indices.codigo >= 0 ? '✅' : '❌'}`);
        console.error(`   - Quantidade: ${indices.quantidade >= 0 ? '✅' : '❌'}`);
        console.log(`⚠️ Pulando planilha ${nomePlanilha} - colunas essenciais não encontradas`);
        continue;
      }
      
      // 3. IDENTIFICAR TOP 10 PRODUTOS MAIS VENDIDOS
      const linhasDados = todasLinhas.slice(linhaCabecalho + 1); // Dados após o cabeçalho
      console.log(`📊 Processando ${linhasDados.length} linhas de dados após o cabeçalho`);
      
      const top10Produtos = identificarTop10ProdutosVendidos(linhasDados, indices);
      
      if (top10Produtos.length === 0) {
        console.log(`⚠️ Nenhum produto vendido encontrado na planilha ${nomePlanilha}`);
        continue;
      }
      
      // 4. CONVERTER PARA FORMATO DE MOVIMENTAÇÕES
      top10Produtos.forEach(produto => {
        movimentacoes.push({
          codigo: produto.codigo,
          produto: `PRODUTO_${produto.codigo}`,
          cfop: produto.cfop,
          entradas: 0,
          saidas: produto.quantidade,
          est_inicial: 0,
          est_final: 0,
          valor_unitario: 0,
          valor_total: 0
        });
      });
      
      linhasProcessadas += linhasDados.length;
    }
    
    console.log(`✅ Leitura REAL concluída: ${movimentacoes.length} movimentações extraídas`);
    
    // VALIDAÇÃO FINAL
    if (movimentacoes.length === 0) {
      console.error('❌ NENHUMA MOVIMENTAÇÃO VÁLIDA ENCONTRADA!');
      console.error('📋 DIAGNÓSTICO TÉCNICO:');
      console.error('   - Arquivo processado com sucesso');
      console.error('   - Colunas mapeadas corretamente');
      console.error('   - MAS: Nenhuma linha com CFOP de venda (5xxx, 6xxx, 7xxx) encontrada');
      console.error('   - OU: Quantidades são zero/inválidas');
      console.error('   - OU: Códigos de produto estão vazios');
      
      throw new Error(`Nenhuma movimentação de venda válida encontrada no arquivo ${file.name}.

DIAGNÓSTICO TÉCNICO:
- Arquivo lido com sucesso
- Colunas mapeadas corretamente  
- MAS: Nenhuma linha com CFOP de venda (5xxx, 6xxx, 7xxx) encontrada
- OU: Quantidades são zero/inválidas
- OU: Códigos de produto estão vazios

VERIFIQUE:
1. Se o arquivo possui dados de vendas (CFOPs 5xxx, 6xxx, 7xxx)
2. Se as quantidades são maiores que zero
3. Se os códigos de produto estão preenchidos
4. Se o cabeçalho está na linha correta`);
    }
    
    return movimentacoes;
    
  } catch (error) {
    console.error('❌ Erro na leitura REAL do Excel:', error);
    throw new Error(`Falha na leitura do Excel ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export interface Top10Produto {
  codigo: string;
  quantidade: number;
  cfop: string;
  produto?: string;
}

export async function identificarTop10ProdutosVendidosExcel(
  file: File,
  onProgress?: (progress: ExcelProcessamentoProgress) => void
): Promise<Top10Produto[]> {
  console.log('🏆 Identificando top 10 produtos mais vendidos do Excel...');
  
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    console.log(`📊 Excel carregado: ${workbook.SheetNames.length} planilhas encontradas`);
    
    const todosProdutos: Top10Produto[] = [];
    
    // Processar cada planilha
    for (let planilhaIndex = 0; planilhaIndex < workbook.SheetNames.length; planilhaIndex++) {
      const nomePlanilha = workbook.SheetNames[planilhaIndex];
      const worksheet = workbook.Sheets[nomePlanilha];
      
      // Atualizar progresso
      if (onProgress) {
          onProgress({
            planilhaAtual: planilhaIndex + 1,
            totalPlanilhas: workbook.SheetNames.length,
          linhasProcessadas: 0,
          movimentacoesEncontradas: todosProdutos.length
        });
      }
      
      console.log(`📄 Processando planilha: ${nomePlanilha}`);
      
      // Ler todas as linhas da planilha
      const todasLinhas = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as string[][];
      
      if (todasLinhas.length === 0) {
        console.log(`⚠️ Planilha ${nomePlanilha} está vazia, pulando...`);
        continue;
      }
      
      // 1. IDENTIFICAR LINHA DO CABEÇALHO REAL
      const linhaCabecalho = identificarLinhaCabecalho(todasLinhas);
      const cabecalho = todasLinhas[linhaCabecalho];
      
      // 2. MAPEAR COLUNAS POR SIMILARIDADE
      const indices = mapearColunasPorSimilaridade(cabecalho);
      
      // Validar se encontrou todas as colunas essenciais
      if (indices.cfop < 0 || indices.codigo < 0 || indices.quantidade < 0) {
        console.log(`⚠️ Planilha ${nomePlanilha} não possui colunas essenciais, pulando...`);
        continue;
      }
      
      // 3. IDENTIFICAR TOP 10 PRODUTOS MAIS VENDIDOS
      const linhasDados = todasLinhas.slice(linhaCabecalho + 1);
      const top10Produtos = identificarTop10ProdutosVendidos(linhasDados, indices);
      
      // Adicionar produtos encontrados
      todosProdutos.push(...top10Produtos);
    }
    
    // Combinar produtos de todas as planilhas e pegar os top 10 globais
    const vendasCombinadas: Record<string, { quantidade: number; cfop: string }> = {};
    
    todosProdutos.forEach(produto => {
      if (!vendasCombinadas[produto.codigo]) {
        vendasCombinadas[produto.codigo] = { quantidade: 0, cfop: produto.cfop };
      }
      vendasCombinadas[produto.codigo].quantidade += produto.quantidade;
    });
    
    // Selecionar top 10 globais
    const top10Global = Object.entries(vendasCombinadas)
      .sort((a, b) => b[1].quantidade - a[1].quantidade)
      .slice(0, 10)
      .map(([codigo, dados]) => ({
        codigo,
        quantidade: dados.quantidade,
        cfop: dados.cfop,
        produto: `PRODUTO_${codigo}`
      }));
    
    console.log(`✅ Top 10 produtos identificados: ${top10Global.length} produtos`);
    top10Global.forEach((produto, index) => {
      console.log(`   ${index + 1}. ${produto.codigo}: ${produto.quantidade} unidades (CFOP: ${produto.cfop})`);
    });
    
    return top10Global;
    
  } catch (error) {
    console.error('❌ Erro ao identificar top 10 produtos:', error);
    throw new Error(`Falha na análise do Excel ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

interface IndicesColunas {
  codigo?: number;
  produto?: number;
  cfop?: number;
  entradas?: number;
  saidas?: number;
  est_inicial?: number;
  est_final?: number;
  valor_unitario?: number;
  valor_total?: number;
  data?: number;
}

function limparNomeColuna(nome: string, index: number): string {
  if (!nome) return '';
  
  // Se é "Unnamed: X", tentar inferir pelo índice
  if (nome.toLowerCase().includes('unnamed')) {
    const colunasConhecidas = [
      'NFE', 'CNPJ Emitente', 'CNPJ Destinatário', 'Modelo', 'Série', 'Número', 'Data', 'CFOP',
      'Item', 'Código', 'Descrição', 'Quantidade', 'Unidade', 'Valor', 'Desconto', 'Despesas',
      'BC ICMS', 'Alíquota', 'ICMS', 'BC ICMS-ST', 'IPI', 'Chave'
    ];
    
    if (index < colunasConhecidas.length) {
      return colunasConhecidas[index];
    }
  }
  
  return nome;
}

function encontrarIndicesColunas(cabecalhos: string[]): IndicesColunas {
  const indices: IndicesColunas = {};
  
  console.log('🔍 Procurando colunas essenciais na planilha fiscal...');
  console.log('📋 Colunas disponíveis:', cabecalhos);
  
  // VALIDAR SE CABECALHOS EXISTEM
  if (!cabecalhos || cabecalhos.length === 0) {
    console.error('❌ Nenhum cabeçalho encontrado na planilha!');
    return indices;
  }
  
  // NORMALIZAR CABECALHOS (remover espaços, acentos, etc.)
  const cabecalhosNormalizados = cabecalhos.map(cab => 
    cab ? cab.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''
  );
  
  console.log('📋 Cabeçalhos normalizados:', cabecalhosNormalizados);
  
  cabecalhosNormalizados.forEach((cabecalhoNormalizado, index) => {
    const cabecalhoOriginal = cabecalhos[index];
    const cabecalhoLimpo = limparNomeColuna(cabecalhoOriginal, index);
    const cabecalhoLimpoNormalizado = cabecalhoLimpo.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // 1. CFOP - DETECÇÃO MUITO FLEXÍVEL
    if (cabecalhoNormalizado === 'cfop' || 
        cabecalhoNormalizado.includes('cfop') ||
        cabecalhoNormalizado === 'codigo fiscal' ||
        cabecalhoNormalizado === 'cod fiscal' ||
        cabecalhoNormalizado === 'fiscal' ||
        cabecalhoNormalizado.includes('cfop') ||
        cabecalhoNormalizado.includes('fiscal') ||
        cabecalhoLimpoNormalizado === 'cfop' ||
        cabecalhoLimpoNormalizado.includes('cfop') ||
        cabecalhoNormalizado.includes('unnamed') && index === 7) { // Fallback para coluna 8
      indices.cfop = index;
      console.log(`✅ CFOP encontrado na coluna ${index + 1}: "${cabecalhoOriginal}" -> "${cabecalhoLimpo}"`);
    }
    
    // 2. CÓDIGO - DETECÇÃO MUITO FLEXÍVEL
    if (cabecalhoNormalizado === 'mercadoria - codigo' || 
        cabecalhoNormalizado === 'codigo da mercadoria' ||
        cabecalhoNormalizado === 'codigo mercadoria' ||
        cabecalhoNormalizado === 'codigo do produto' ||
        cabecalhoNormalizado === 'codigo produto' ||
        cabecalhoNormalizado === 'codigo' ||
        cabecalhoNormalizado === 'cod' ||
        cabecalhoNormalizado === 'id' ||
        cabecalhoNormalizado === 'item' ||
        cabecalhoNormalizado.includes('codigo') ||
        cabecalhoNormalizado.includes('cod') ||
        cabecalhoNormalizado.includes('produto') ||
        cabecalhoNormalizado.includes('mercadoria') ||
        cabecalhoNormalizado.includes('item') ||
        cabecalhoLimpoNormalizado === 'codigo' ||
        cabecalhoLimpoNormalizado.includes('codigo') ||
        cabecalhoNormalizado.includes('unnamed') && index === 9) { // Fallback para coluna 10
      indices.codigo = index;
      console.log(`✅ Código da Mercadoria encontrado na coluna ${index + 1}: "${cabecalhoOriginal}" -> "${cabecalhoLimpo}"`);
    }
    
    // 3. QUANTIDADE - DETECÇÃO MUITO FLEXÍVEL
    if (cabecalhoNormalizado === 'mercadoria - qtde' || 
        cabecalhoNormalizado === 'mercadoria - quantidade' ||
        cabecalhoNormalizado === 'quantidade da mercadoria' ||
        cabecalhoNormalizado === 'quantidade mercadoria' ||
        cabecalhoNormalizado === 'quantidade do produto' ||
        cabecalhoNormalizado === 'quantidade produto' ||
        cabecalhoNormalizado === 'qtde' ||
        cabecalhoNormalizado === 'quantidade' ||
        cabecalhoNormalizado === 'qtd' ||
        cabecalhoNormalizado === 'qty' ||
        cabecalhoNormalizado === 'amount' ||
        cabecalhoNormalizado === 'saidas' ||
        cabecalhoNormalizado === 'saida' ||
        cabecalhoNormalizado.includes('quantidade') ||
        cabecalhoNormalizado.includes('qtde') ||
        cabecalhoNormalizado.includes('qtd') ||
        cabecalhoNormalizado.includes('saidas') ||
        cabecalhoLimpoNormalizado === 'quantidade' ||
        cabecalhoLimpoNormalizado.includes('quantidade') ||
        cabecalhoNormalizado.includes('unnamed') && index === 11) { // Fallback para coluna 12
      indices.saidas = index; // Usar 'saidas' para quantidade vendida
      console.log(`✅ Quantidade da Mercadoria encontrada na coluna ${index + 1}: "${cabecalhoOriginal}" -> "${cabecalhoLimpo}"`);
    }
  });
  
  // TENTATIVA DE DETECÇÃO POR POSIÇÃO (fallback mais agressivo)
  if (!indices.cfop && cabecalhos.length >= 8) {
    // Geralmente CFOP está na posição 7 (índice 6)
    indices.cfop = 6;
    console.log(`🔄 Fallback: CFOP assumido na coluna 7: "${cabecalhos[6]}"`);
  }
  
  if (!indices.codigo && cabecalhos.length >= 10) {
    // Geralmente código está na posição 9 (índice 8)
    indices.codigo = 8;
    console.log(`🔄 Fallback: Código assumido na coluna 9: "${cabecalhos[8]}"`);
  }
  
  if (!indices.saidas && cabecalhos.length >= 12) {
    // Geralmente quantidade está na posição 11 (índice 10)
    indices.saidas = 10;
    console.log(`🔄 Fallback: Quantidade assumida na coluna 11: "${cabecalhos[10]}"`);
  }
  
  // VALIDAR SE ENCONTROU AS 3 COLUNAS ESSENCIAIS
  if (!indices.cfop) {
    console.error('❌ CFOP não encontrado! Coluna obrigatória para análise fiscal.');
    console.log('🔍 Procurando por colunas que contenham "CFOP"...');
    cabecalhos.forEach((col, idx) => {
      if (col && col.toLowerCase().includes('cfop')) {
        console.log(`   Encontrada: "${col}" na posição ${idx + 1}`);
      }
    });
  }
  if (!indices.codigo) {
    console.error('❌ Código da Mercadoria não encontrado! Coluna obrigatória para identificar produtos.');
    console.log('🔍 Procurando por colunas que contenham "código" ou "produto"...');
    cabecalhos.forEach((col, idx) => {
      if (col && (col.toLowerCase().includes('código') || col.toLowerCase().includes('codigo') || col.toLowerCase().includes('produto'))) {
        console.log(`   Encontrada: "${col}" na posição ${idx + 1}`);
      }
    });
  }
  if (!indices.saidas) {
    console.error('❌ Quantidade da Mercadoria não encontrada! Coluna obrigatória para calcular vendas.');
    console.log('🔍 Procurando por colunas que contenham "quantidade", "qtde" ou "saidas"...');
    cabecalhos.forEach((col, idx) => {
      if (col && (col.toLowerCase().includes('quantidade') || col.toLowerCase().includes('qtde') || col.toLowerCase().includes('saidas'))) {
        console.log(`   Encontrada: "${col}" na posição ${idx + 1}`);
      }
    });
  }
  
  console.log('📊 Colunas essenciais mapeadas:', {
    cfop: indices.cfop !== undefined ? cabecalhos[indices.cfop] : 'NÃO ENCONTRADO',
    codigo: indices.codigo !== undefined ? cabecalhos[indices.codigo] : 'NÃO ENCONTRADO',
    quantidade: indices.saidas !== undefined ? cabecalhos[indices.saidas] : 'NÃO ENCONTRADO'
  });
  
  return indices;
}

function extrairMovimentacaoDaLinha(linha: any[], indices: IndicesColunas): ExcelMovimentacao | null {
  try {
    // EXTRAIR APENAS OS 3 DADOS ESSENCIAIS:
    
    // 1. CFOP - Para identificar se é venda (5xxx, 6xxx, 7xxx)
    const cfop = indices.cfop !== undefined ? String(linha[indices.cfop] || '').trim() : '';
    
    // 2. Código da Mercadoria - Para identificar o produto
    const codigo = indices.codigo !== undefined ? String(linha[indices.codigo] || '').trim() : '';
    
    // 3. Quantidade da Mercadoria - Para calcular vendas
    const quantidade = indices.saidas !== undefined ? parseFloat(linha[indices.saidas]) || 0 : 0;
    
    // VALIDAÇÕES MAIS FLEXÍVEIS:
    
    // 1. Deve ter CFOP (mais flexível)
    if (!cfop || cfop === '' || cfop === 'undefined' || cfop === 'null') {
      return null; // Pular linha sem CFOP
    }
    
    // 2. Deve ter código da mercadoria (mais flexível)
    if (!codigo || codigo === '' || codigo === 'undefined' || codigo === 'null') {
      return null; // Pular linha sem código
    }
    
    // 3. Deve ter quantidade válida (mais flexível)
    if (quantidade <= 0 || isNaN(quantidade)) {
      return null; // Pular linha sem quantidade
    }
    
    // 4. Verificar se é CFOP de venda (5xxx, 6xxx, 7xxx) - mais flexível
    const cfopStr = String(cfop).replace(/\D/g, ''); // Remove não-dígitos
    const cfopNum = parseInt(cfopStr);
    const isVenda = cfopNum >= 5000 && cfopNum < 8000;
    
    if (!isVenda) {
      // Log mais detalhado para debug
      console.log(`⚠️ Linha pulada - CFOP não é venda: "${cfop}" (${cfopNum})`);
      return null; // Pular linhas que não são vendas
    }
    
    // RETORNAR MOVIMENTAÇÃO DE VENDA:
    return {
      codigo: codigo,
      produto: `PRODUTO_${codigo}`, // Nome genérico baseado no código
      cfop: cfop,
      entradas: 0, // Vendas não têm entradas
      saidas: quantidade, // Quantidade vendida
      est_inicial: 0, // Não temos estoque inicial da planilha
      est_final: 0, // Não temos estoque final da planilha
      valor_unitario: 0, // Não estamos usando
      valor_total: 0, // Não estamos usando
      data_movimento: '' // Não estamos usando
    };
    
  } catch (error) {
    console.error('❌ Erro ao extrair movimentação da linha:', error, linha);
    return null;
  }
}

function identificarLinhaCabecalho(linhas: string[][]): number {
  console.log('🔍 Identificando linha do cabeçalho real...');
  
  // Verificar as primeiras 10 linhas para encontrar o cabeçalho
  for (let i = 0; i < Math.min(10, linhas.length); i++) {
    const linha = linhas[i];
    console.log(`  Verificando linha ${i + 1}:`, linha);
    
    // Normalizar a linha para busca
    const linhaNormalizada = linha.map(c => 
      c ? c.toLowerCase().trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''
    );
    
    // Padrões mais amplos para detectar cabeçalho
    const padroesCFOP = [/cfop/i, /codigo\s*fiscal/i, /cod\s*fiscal/i, /natureza\s*operacao/i, /operacao/i, /fiscal/i];
    const padroesCodigo = [/codigo/i, /cod/i, /produto/i, /mercadoria/i, /item/i, /id/i, /referencia/i];
    const padroesQuantidade = [/quantidade/i, /qtd/i, /qtde/i, /qty/i, /amount/i, /saidas/i, /saida/i, /movimento/i, /volume/i];
    
    // Verificar se esta linha tem pelo menos 2 das 3 colunas essenciais
    const temCFOP = linhaNormalizada.some(col => padroesCFOP.some(p => p.test(col)));
    const temCodigo = linhaNormalizada.some(col => padroesCodigo.some(p => p.test(col)));
    const temQuantidade = linhaNormalizada.some(col => padroesQuantidade.some(p => p.test(col)));
    
    console.log(`    Linha ${i + 1}: CFOP=${temCFOP}, Código=${temCodigo}, Quantidade=${temQuantidade}`);
    
    // Se encontrou pelo menos 2 das 3 colunas essenciais, é provavelmente o cabeçalho
    const colunasEncontradas = [temCFOP, temCodigo, temQuantidade].filter(Boolean).length;
    if (colunasEncontradas >= 2) {
      console.log(`✅ Cabeçalho encontrado na linha ${i + 1} (${colunasEncontradas}/3 colunas essenciais)`);
      return i;
    }
  }
  
  console.log('⚠️ Cabeçalho não encontrado nas primeiras 10 linhas, usando linha 1');
  return 0;
}

function mapearColunasPorSimilaridade(cabecalho: string[]): { cfop: number; codigo: number; quantidade: number } {
  console.log('🔍 Mapeando colunas por similaridade ROBUSTA...');
  console.log('📋 Cabeçalho completo:', cabecalho);
  
  // Normalizar cabeçalho (remover espaços, acentos, converter para minúsculas)
  const cabecalhoNormalizado = cabecalho.map(col => 
    col ? col.toLowerCase().trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''
  );
  
  console.log('📋 Cabeçalho normalizado:', cabecalhoNormalizado);
  
  // BUSCA ROBUSTA PARA CFOP
  const padroesCfop = [
    /cfop/i,
    /codigo\s*fiscal/i,
    /cod\s*fiscal/i,
    /natureza\s*operacao/i,
    /operacao/i,
    /fiscal/i
  ];
  
  let idxCfop = -1;
  for (const padrao of padroesCfop) {
    idxCfop = cabecalhoNormalizado.findIndex(col => padrao.test(col));
    if (idxCfop >= 0) {
      console.log(`✅ CFOP encontrado: "${cabecalho[idxCfop]}" (padrão: ${padrao})`);
      break;
    }
  }
  
  // BUSCA ROBUSTA PARA CÓDIGO
  const padroesCodigo = [
    /codigo/i,
    /cod/i,
    /produto/i,
    /mercadoria/i,
    /item/i,
    /id/i,
    /referencia/i
  ];
  
  let idxCodigo = -1;
  for (const padrao of padroesCodigo) {
    idxCodigo = cabecalhoNormalizado.findIndex(col => padrao.test(col));
    if (idxCodigo >= 0) {
      console.log(`✅ Código encontrado: "${cabecalho[idxCodigo]}" (padrão: ${padrao})`);
      break;
    }
  }
  
  // BUSCA ROBUSTA PARA QUANTIDADE
  const padroesQuantidade = [
    /quantidade/i,
    /qtd/i,
    /qtde/i,
    /qty/i,
    /amount/i,
    /saidas/i,
    /saida/i,
    /movimento/i,
    /volume/i
  ];
  
  let idxQuantidade = -1;
  for (const padrao of padroesQuantidade) {
    idxQuantidade = cabecalhoNormalizado.findIndex(col => padrao.test(col));
    if (idxQuantidade >= 0) {
      console.log(`✅ Quantidade encontrada: "${cabecalho[idxQuantidade]}" (padrão: ${padrao})`);
      break;
    }
  }
  
  // FALLBACK POR POSIÇÃO (se não encontrou por nome)
  if (idxCfop < 0 && cabecalho.length >= 8) {
    idxCfop = 7; // CFOP geralmente está na coluna 8
    console.log(`🔄 Fallback CFOP: coluna ${idxCfop + 1} ("${cabecalho[idxCfop]}")`);
  }
  
  if (idxCodigo < 0 && cabecalho.length >= 10) {
    idxCodigo = 9; // Código geralmente está na coluna 10
    console.log(`🔄 Fallback Código: coluna ${idxCodigo + 1} ("${cabecalho[idxCodigo]}")`);
  }
  
  if (idxQuantidade < 0 && cabecalho.length >= 12) {
    idxQuantidade = 11; // Quantidade geralmente está na coluna 12
    console.log(`🔄 Fallback Quantidade: coluna ${idxQuantidade + 1} ("${cabecalho[idxQuantidade]}")`);
  }
  
  // LOG FINAL DETALHADO
  console.log(`📊 MAPEAMENTO FINAL:`);
  console.log(`   CFOP: ${idxCfop >= 0 ? `coluna ${idxCfop + 1} ("${cabecalho[idxCfop]}")` : '❌ NÃO ENCONTRADO'}`);
  console.log(`   Código: ${idxCodigo >= 0 ? `coluna ${idxCodigo + 1} ("${cabecalho[idxCodigo]}")` : '❌ NÃO ENCONTRADO'}`);
  console.log(`   Quantidade: ${idxQuantidade >= 0 ? `coluna ${idxQuantidade + 1} ("${cabecalho[idxQuantidade]}")` : '❌ NÃO ENCONTRADO'}`);
  
  // Se não encontrou nenhuma coluna essencial, mostrar todas as colunas disponíveis
  if (idxCfop < 0 || idxCodigo < 0 || idxQuantidade < 0) {
    console.log('❌ COLUNAS DISPONÍVEIS (para debug):');
    cabecalho.forEach((col, index) => {
      console.log(`   ${index + 1}. "${col}"`);
    });
  }
  
  return { cfop: idxCfop, codigo: idxCodigo, quantidade: idxQuantidade };
}

function identificarTop10ProdutosVendidos(
  linhas: string[][], 
  indices: { cfop: number; codigo: number; quantidade: number }
): { codigo: string; quantidade: number; cfop: string }[] {
  console.log('🔍 Identificando top 10 produtos mais vendidos...');
  console.log(`📊 Processando ${linhas.length} linhas de dados`);
  console.log(`📋 Índices das colunas: CFOP=${indices.cfop}, Código=${indices.codigo}, Quantidade=${indices.quantidade}`);
  
  const vendas: Record<string, { quantidade: number; cfop: string }> = {};
  let linhasProcessadas = 0;
  let linhasValidas = 0;
  let cfopsVendaEncontrados = 0;
  
  // Filtrar apenas movimentações de venda (CFOP 5xxx, 6xxx, 7xxx)
  for (const linha of linhas) {
    linhasProcessadas++;
    
    // Extrair dados da linha
    const cfop = String(linha[indices.cfop] || '').trim();
    const codigo = String(linha[indices.codigo] || '').trim();
    const quantidade = parseFloat(linha[indices.quantidade]) || 0;
    
    // Log das primeiras 5 linhas para debug
    if (linhasProcessadas <= 5) {
      console.log(`   Linha ${linhasProcessadas}: CFOP="${cfop}", Código="${codigo}", Qtd=${quantidade}`);
    }
    
    // Validar dados básicos
    if (!cfop || !codigo || quantidade <= 0) {
      if (linhasProcessadas <= 10) {
        console.log(`   ⚠️ Linha ${linhasProcessadas} pulada - dados inválidos: CFOP="${cfop}", Código="${codigo}", Qtd=${quantidade}`);
      }
      continue;
    }
    
    // Filtrar apenas CFOPs de venda (5xxx, 6xxx, 7xxx)
    if (!/^[567]/.test(cfop)) {
      if (linhasProcessadas <= 10) {
        console.log(`   ⚠️ Linha ${linhasProcessadas} pulada - CFOP não é venda: "${cfop}"`);
      }
      continue;
    }
    
    // Linha válida encontrada
    linhasValidas++;
    cfopsVendaEncontrados++;
    
    // Somar quantidades por produto
    if (!vendas[codigo]) {
      vendas[codigo] = { quantidade: 0, cfop: cfop };
    }
    vendas[codigo].quantidade += quantidade;
    
    // Log das primeiras vendas encontradas
    if (cfopsVendaEncontrados <= 10) {
      console.log(`   ✅ Venda válida: ${codigo} - ${quantidade} unidades (CFOP: ${cfop})`);
    }
  }
  
  console.log(`📊 RESUMO DO PROCESSAMENTO:`);
  console.log(`   - Linhas processadas: ${linhasProcessadas}`);
  console.log(`   - Linhas válidas: ${linhasValidas}`);
  console.log(`   - CFOPs de venda encontrados: ${cfopsVendaEncontrados}`);
  console.log(`   - Produtos únicos com vendas: ${Object.keys(vendas).length}`);
  
  if (Object.keys(vendas).length === 0) {
    console.log('❌ Nenhuma venda válida encontrada!');
    console.log('💡 Possíveis causas:');
    console.log('   - CFOPs não são de venda (5xxx, 6xxx, 7xxx)');
    console.log('   - Quantidades são zero ou inválidas');
    console.log('   - Códigos de produto estão vazios');
    return [];
  }
  
  // Selecionar os 10 produtos mais vendidos
  const top10 = Object.entries(vendas)
    .sort((a, b) => b[1].quantidade - a[1].quantidade)
    .slice(0, 10)
    .map(([codigo, dados]) => ({
      codigo,
      quantidade: dados.quantidade,
      cfop: dados.cfop
    }));
  
  console.log('🏆 Top 10 produtos mais vendidos:');
  top10.forEach((produto, index) => {
    console.log(`   ${index + 1}. ${produto.codigo}: ${produto.quantidade} unidades (CFOP: ${produto.cfop})`);
  });
  
  return top10;
}

// Função para processar Excel em chunks (para arquivos muito grandes)
export async function processarExcelEmChunks(
  file: File,
  chunkSize: number = 1000,
  onProgress?: (progress: ExcelProcessamentoProgress) => void
): Promise<ExcelMovimentacao[]> {
  console.log('📊 Processando Excel grande em chunks...');
  
  try {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  const movimentacoes: ExcelMovimentacao[] = [];
    let linhasProcessadas = 0;
  
    // Processar cada planilha
    for (let planilhaIndex = 0; planilhaIndex < workbook.SheetNames.length; planilhaIndex++) {
    const nomePlanilha = workbook.SheetNames[planilhaIndex];
    const worksheet = workbook.Sheets[nomePlanilha];
      
    const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (dados.length === 0) continue;
    
    const cabecalhos = dados[0] as string[];
    const indices = encontrarIndicesColunas(cabecalhos);
    
      // Processar linhas em chunks
    for (let i = 1; i < dados.length; i += chunkSize) {
        const chunk = dados.slice(i, i + chunkSize);
      
      for (const linha of chunk) {
        const movimentacao = extrairMovimentacaoDaLinha(linha as any[], indices);
        if (movimentacao) {
          movimentacoes.push(movimentacao);
        }
          linhasProcessadas++;
      }
      
      // Atualizar progresso
      if (onProgress) {
        onProgress({
          planilhaAtual: planilhaIndex + 1,
            totalPlanilhas: workbook.SheetNames.length,
            linhasProcessadas,
          movimentacoesEncontradas: movimentacoes.length
        });
      }
    }
  }
  
  return movimentacoes;
    
  } catch (error) {
    console.error('❌ Erro no processamento em chunks:', error);
    throw error;
  }
} 