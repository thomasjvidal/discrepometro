#!/usr/bin/env node
/**
 * Discrepômetro Automático - Radar Fiscal Inteligente
 * Sistema para detectar discrepâncias entre inventário declarado e movimentações fiscais
 */

const fs = require('fs-extra');
const path = require('path');
const csv = require('fast-csv');
const pdfParse = require('pdf-parse');
const _ = require('lodash');

class DiscrepometroAuto {
    constructor() {
        this.cfopsVenda = ['5101', '5102', '6101', '6102', '5405', '6405'];
        this.cfopsCompra = ['1101', '1102', '2101', '2102'];
        this.resultados = {
            timestamp: new Date().toISOString(),
            estatisticas: {
                total_produtos: 0,
                criticos: 0,
                alertas: 0,
                ok: 0,
                percentual_critico: 0
            },
            top10_produtos: [],
            discrepancias: []
        };
    }

    /**
     * Etapa 1: Identificar automaticamente os arquivos recebidos
     */
    async identificarArquivos(diretorio) {
        console.log('🔍 Identificando arquivos de entrada...');
    
        const arquivos = await fs.readdir(diretorio);
        const resultado = {
            inventario2023: '',
            inventario2024: '',
            emitente: '',
            destinatario: ''
        };

        for (const arquivo of arquivos) {
            const nomeLower = arquivo.toLowerCase();
            const caminhoCompleto = path.join(diretorio, arquivo);

            // Identificar PDFs de inventário
            if (arquivo.endsWith('.pdf')) {
                if (nomeLower.includes('2023') || nomeLower.includes('inventario')) {
                    if (!nomeLower.includes('2024')) {
                        resultado.inventario2023 = caminhoCompleto;
                        console.log(`📄 Inventário 2023: ${arquivo}`);
                    }
        } else if (nomeLower.includes('2024')) {
                    resultado.inventario2024 = caminhoCompleto;
                    console.log(`📄 Inventário 2024: ${arquivo}`);
                }
            }

            // Identificar planilhas de movimentação
            if (arquivo.endsWith('.csv') || arquivo.endsWith('.xlsx')) {
                if (nomeLower.includes('emitente')) {
                    resultado.emitente = caminhoCompleto;
                    console.log(`📊 Emitente: ${arquivo}`);
        } else if (nomeLower.includes('destinatario')) {
                    resultado.destinatario = caminhoCompleto;
                    console.log(`📊 Destinatário: ${arquivo}`);
                }
            }
        }

        // Validar se todos os arquivos foram encontrados
        const arquivosFaltantes = Object.entries(resultado)
            .filter(([_, valor]) => !valor)
            .map(([chave, _]) => chave);

        if (arquivosFaltantes.length > 0) {
            throw new Error(`Arquivos não encontrados: ${arquivosFaltantes.join(', ')}`);
        }

        console.log('✅ Todos os arquivos identificados com sucesso!');
        return resultado;
    }

    /**
     * Etapa 2: Processar planilhas de movimentação com streaming
     */
    async processarPlanilhasMovimentacao(arquivos) {
        console.log('📊 Processando planilhas de movimentação...');

        const produtos = new Map();

        // Processar emitente
        console.log('📈 Processando planilha emitente...');
        await this.processarPlanilha(arquivos.emitente, produtos, 'emitente');

        // Processar destinatário
        console.log('📉 Processando planilha destinatário...');
        await this.processarPlanilha(arquivos.destinatario, produtos, 'destinatario');

        // Converter para array e ordenar por quantidade vendida
        const produtosArray = Array.from(produtos.values());
        const produtosOrdenados = _.orderBy(produtosArray, ['quantidade'], ['desc']);

        // Pegar top 10
        const top10 = produtosOrdenados.slice(0, 10);

        console.log('🏆 Top 10 produtos mais vendidos:');
        top10.forEach((produto, index) => {
            console.log(`  ${index + 1}. ${produto.nome} - ${produto.quantidade} unidades`);
        });

        return top10;
    }

    async processarPlanilha(caminhoArquivo, produtos, tipo) {
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(caminhoArquivo);
            let primeiraLinha = true;
            let colunas = [];

            stream
                .pipe(csv.parse())
                .on('data', (linha) => {
                if (primeiraLinha) {
                    colunas = linha;
                    primeiraLinha = false;
                    return;
                }

                try {
                    const produto = this.extrairProduto(linha, colunas);
                    if (produto && this.cfopsVenda.includes(produto.cfop)) {
                        const chave = produto.nome.toLowerCase();
                        const existente = produtos.get(chave);

                        if (existente) {
                            existente.quantidade += produto.quantidade;
                            existente.valor_total += produto.valor_total;
                if (!existente.cfops_utilizados) existente.cfops_utilizados = [];
                            existente.cfops_utilizados.push(produto.cfop);
              } else {
                            produtos.set(chave, {
                                ...produto,
                                cfops_utilizados: [produto.cfop]
                            });
                        }
                    }
          } catch (error) {
                    console.warn(`⚠️ Erro ao processar linha: ${error}`);
                }
            })
                .on('end', () => {
                console.log(`✅ ${tipo} processado: ${produtos.size} produtos únicos`);
                resolve();
            })
                .on('error', reject);
        });
    }

    extrairProduto(linha, colunas) {
        // Mapeamento de colunas
        const mapeamento = {
            nome: ['produto', 'descricao', 'descrição', 'nome_produto', 'item'],
            codigo: ['codigo', 'código', 'sku', 'cod_produto'],
            quantidade: ['quantidade', 'qtd', 'qtde', 'qty'],
            valor_unitario: ['valor_unitario', 'preco_unitario', 'vl_unit'],
            valor_total: ['valor_total', 'valor', 'vl_total', 'total'],
            cfop: ['cfop', 'cfop_operacao']
        };

        const dados = {};
    
        for (const [campo, possiveisNomes] of Object.entries(mapeamento)) {
            for (const nomePossivel of possiveisNomes) {
        const indice = colunas.findIndex(col => 
          col.toLowerCase().includes(nomePossivel.toLowerCase())
        );
                if (indice !== -1) {
                    dados[campo] = linha[indice];
                    break;
                }
            }
        }

        // Validar dados essenciais
        if (!dados.nome || !dados.quantidade || !dados.cfop) {
            return null;
        }

        return {
            nome: String(dados.nome).trim(),
            codigo: String(dados.codigo || ''),
            quantidade: parseFloat(dados.quantidade) || 0,
            valor_unitario: parseFloat(dados.valor_unitario) || 0,
            valor_total: parseFloat(dados.valor_total) || 0,
            cfop: String(dados.cfop).trim()
        };
    }

    /**
     * Etapa 3: Processar PDFs de inventário
     */
    async processarPDFsInventario(arquivos, produtosTop10) {
        console.log('📄 Processando PDFs de inventário...');

        const inventarios = new Map();

        // Processar inventário 2023
        console.log('📋 Processando inventário 2023...');
        const inventario2023 = await this.extrairDadosPDF(arquivos.inventario2023, produtosTop10);

        // Processar inventário 2024
        console.log('📋 Processando inventário 2024...');
        const inventario2024 = await this.extrairDadosPDF(arquivos.inventario2024, produtosTop10);

        // Combinar dados
        for (const produto of produtosTop10) {
            const dados2023 = inventario2023.get(produto.nome.toLowerCase());
            const dados2024 = inventario2024.get(produto.nome.toLowerCase());

            inventarios.set(produto.nome.toLowerCase(), {
                nome: produto.nome,
                codigo: produto.codigo,
                quantidade_2023: dados2023?.quantidade || 0,
                quantidade_2024: dados2024?.quantidade || 0,
                valor_unitario: dados2024?.valor_unitario || produto.valor_unitario,
                valor_total: dados2024?.valor_total || produto.valor_total
            });
        }

        console.log(`✅ Inventários processados: ${inventarios.size} produtos encontrados`);
        return inventarios;
    }

    async extrairDadosPDF(caminhoPDF, produtosBusca) {
        const dados = new Map();

        try {
            const buffer = await fs.readFile(caminhoPDF);
            const pdfData = await pdfParse(buffer);
            const texto = pdfData.text;

            // Regex para extrair dados de produtos
            const regexProduto = /(\d+)\s+([A-Za-zÀ-ÿ\s\-\/\.]+)\s+(\d+)\s+([\d,\.]+)\s+([\d,\.]+)/g;
            let match;

            while ((match = regexProduto.exec(texto)) !== null) {
                const [, codigo, nome, quantidade, valorUnitario, valorTotal] = match;
        
                const produtoLimpo = nome.trim();
                const chave = produtoLimpo.toLowerCase();

                // Verificar se é um dos produtos que estamos buscando
        const produtoEncontrado = produtosBusca.find(p => 
          p.nome.toLowerCase().includes(chave) || 
          chave.includes(p.nome.toLowerCase())
        );

                if (produtoEncontrado) {
                    dados.set(chave, {
                        nome: produtoLimpo,
                        codigo: codigo,
                        quantidade: parseFloat(quantidade.replace(',', '.')),
                        valor_unitario: parseFloat(valorUnitario.replace(',', '.')),
                        valor_total: parseFloat(valorTotal.replace(',', '.'))
                    });
                }
            }

            console.log(`📄 PDF processado: ${dados.size} produtos relevantes encontrados`);
    } catch (error) {
            console.error(`❌ Erro ao processar PDF ${caminhoPDF}:`, error);
        }

        return dados;
    }

    /**
     * Etapa 4: Calcular discrepâncias
     */
    calcularDiscrepancias(produtosTop10, inventarios) {
        console.log('🔍 Calculando discrepâncias...');

        const discrepancias = [];

        for (const produto of produtosTop10) {
            const inventario = inventarios.get(produto.nome.toLowerCase());
      
            if (!inventario) {
                discrepancias.push({
                    produto: produto.nome,
                    codigo: produto.codigo,
                    quantidade_vendida: produto.quantidade,
                    quantidade_comprada: 0,
                    estoque_inicial: 0,
                    estoque_final: 0,
                    discrepancia: produto.quantidade, // Vendeu mas não tinha no inventário
                    status: 'CRÍTICO',
                    valor_total_vendido: produto.valor_total,
                    cfops_utilizados: produto.cfops_utilizados || []
                });
                continue;
            }

            const estoqueInicial = inventario.quantidade_2023;
            const estoqueFinal = inventario.quantidade_2024;
            const quantidadeVendida = produto.quantidade;

            // Calcular discrepância: estoque_final - estoque_inicial + vendas
            const discrepancia = estoqueFinal - estoqueInicial + quantidadeVendida;

            // Determinar status
            let status = 'OK';
      
            if (estoqueInicial === 0 && quantidadeVendida > 0) {
                status = 'CRÍTICO'; // Vendeu sem ter no inventário inicial
      } else if (Math.abs(discrepancia) > quantidadeVendida * 0.1) {
                status = discrepancia < 0 ? 'CRÍTICO' : 'ALERTA';
            }

            discrepancias.push({
                produto: produto.nome,
                codigo: produto.codigo,
                quantidade_vendida: quantidadeVendida,
                quantidade_comprada: 0, // Seria calculado se tivéssemos dados de compra
                estoque_inicial: estoqueInicial,
                estoque_final: estoqueFinal,
                discrepancia: discrepancia,
                status: status,
                valor_total_vendido: produto.valor_total,
                cfops_utilizados: produto.cfops_utilizados || []
            });
        }

        return discrepancias;
    }

    /**
     * Etapa 5: Gerar relatório final
     */
    gerarRelatorioFinal(produtosTop10, discrepancias) {
        console.log('📊 Gerando relatório final...');

        const criticos = discrepancias.filter(d => d.status === 'CRÍTICO').length;
        const alertas = discrepancias.filter(d => d.status === 'ALERTA').length;
        const ok = discrepancias.filter(d => d.status === 'OK').length;
        const total = discrepancias.length;

        this.resultados = {
            timestamp: new Date().toISOString(),
            estatisticas: {
                total_produtos: total,
                criticos: criticos,
                alertas: alertas,
                ok: ok,
                percentual_critico: total > 0 ? Math.round((criticos / total) * 100) : 0
            },
            top10_produtos: produtosTop10,
            discrepancias: discrepancias
        };

        console.log('📈 Estatísticas do relatório:');
        console.log(`  - Total de produtos: ${total}`);
        console.log(`  - Críticos: ${criticos}`);
        console.log(`  - Alertas: ${alertas}`);
        console.log(`  - OK: ${ok}`);
        console.log(`  - Percentual crítico: ${this.resultados.estatisticas.percentual_critico}%`);

        return this.resultados;
    }

    /**
     * Executar análise completa
     */
    async executarAnalise(diretorio) {
        console.log('🚀 INICIANDO ANÁLISE DO DISCREPÔMETRO AUTOMÁTICO');
    console.log('='.repeat(60));

        try {
            // Etapa 1: Identificar arquivos
            const arquivos = await this.identificarArquivos(diretorio);

            // Etapa 2: Processar planilhas de movimentação
            const produtosTop10 = await this.processarPlanilhasMovimentacao(arquivos);

            // Etapa 3: Processar PDFs de inventário
            const inventarios = await this.processarPDFsInventario(arquivos, produtosTop10);

            // Etapa 4: Calcular discrepâncias
            const discrepancias = this.calcularDiscrepancias(produtosTop10, inventarios);

            // Etapa 5: Gerar relatório final
            const relatorio = this.gerarRelatorioFinal(produtosTop10, discrepancias);

            console.log('✅ ANÁLISE CONCLUÍDA COM SUCESSO!');
      console.log('='.repeat(60));

            return relatorio;

    } catch (error) {
            console.error('❌ Erro na análise:', error);
            throw error;
        }
    }
}

// Função principal
async function main() {
    if (process.argv.length !== 3) {
        console.log('Uso: node discrepometro_auto.js <diretorio_arquivos>');
        process.exit(1);
    }

    const diretorio = process.argv[2];

    try {
        const discrepometro = new DiscrepometroAuto();
        const resultado = await discrepometro.executarAnalise(diretorio);

        // Salvar resultado em JSON
        const outputFile = path.join(diretorio, 'relatorio_discrepometro_auto.json');
        await fs.writeJson(outputFile, resultado, { spaces: 2 });

        console.log(`\n✅ Relatório salvo em: ${outputFile}`);
        console.log(`📊 Total de produtos analisados: ${resultado.estatisticas.total_produtos}`);
        console.log(`🚨 Produtos críticos: ${resultado.estatisticas.criticos}`);
        console.log(`⚠️  Produtos em alerta: ${resultado.estatisticas.alertas}`);

  } catch (error) {
        console.error(`❌ Erro: ${error}`);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { DiscrepometroAuto };
