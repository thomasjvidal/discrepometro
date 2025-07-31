#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DISCREPÂNCIA - Módulo para cálculo de discrepâncias fiscais
==========================================================

Responsável por:
- Calcular estoque esperado
- Comparar com estoque real
- Determinar status de discrepância
- Classificar tipos de erro
"""

from typing import List, Dict, Any
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def calcular_estoque_esperado(estoque_inicial: float, vendas: float) -> float:
    """
    Calcula o estoque esperado baseado no estoque inicial e vendas.
    
    Args:
        estoque_inicial: Quantidade inicial em estoque
        vendas: Quantidade vendida no período
        
    Returns:
        Estoque esperado (inicial - vendas)
    """
    return estoque_inicial - vendas


def calcular_discrepancia(estoque_final: float, estoque_esperado: float) -> float:
    """
    Calcula a discrepância entre estoque final real e esperado.
    
    Args:
        estoque_final: Quantidade final real em estoque
        estoque_esperado: Quantidade esperada em estoque
        
    Returns:
        Diferença (final - esperado)
    """
    return estoque_final - estoque_esperado


def determinar_status(discrepancia: float, tolerancia: float = 1.0) -> str:
    """
    Determina o status baseado na discrepância e tolerância.
    
    Args:
        discrepancia: Valor da discrepância
        tolerancia: Tolerância aceitável (padrão: 1.0)
        
    Returns:
        'OK' se dentro da tolerância, 'ERRO' caso contrário
    """
    if abs(discrepancia) <= tolerancia:
        return 'OK'
    else:
        return 'ERRO'


def classificar_tipo_discrepancia(discrepancia: float) -> str:
    """
    Classifica o tipo de discrepância baseado no valor.
    
    Args:
        discrepancia: Valor da discrepância
        
    Returns:
        Descrição do tipo de discrepância
    """
    if discrepancia == 0:
        return "Sem discrepância"
    elif discrepancia > 0:
        return "Estoque Excedente (Compra sem Nota)"
    else:
        return "Estoque Faltante (Venda sem Nota)"


def calcular_discrepancias(produtos_processados: List[Dict[str, Any]], tolerancia: float = 1.0) -> List[Dict[str, Any]]:
    """
    Calcula discrepâncias para todos os produtos processados.
    
    Args:
        produtos_processados: Lista de produtos com dados de estoque
        tolerancia: Tolerância para considerar discrepância (padrão: 1.0)
        
    Returns:
        Lista de resultados com discrepâncias calculadas
    """
    logger.info("⚖️ Calculando discrepâncias para todos os produtos...")
    
    resultados = []
    
    for produto in produtos_processados:
        try:
            # Extrair dados do produto
            codigo = produto.get('codigo', '')
            descricao = produto.get('descricao', '')
            vendas = produto.get('vendas', 0.0)
            estoque_inicial = produto.get('estoque_inicial', 0.0)
            estoque_final = produto.get('estoque_final', 0.0)
            
            # Calcular estoque esperado
            estoque_esperado = calcular_estoque_esperado(estoque_inicial, vendas)
            
            # Calcular discrepância
            discrepancia = calcular_discrepancia(estoque_final, estoque_esperado)
            
            # Determinar status
            status = determinar_status(discrepancia, tolerancia)
            
            # Classificar tipo de discrepância
            tipo_discrepancia = classificar_tipo_discrepancia(discrepancia)
            
            # Criar resultado
            resultado = {
                'produto': descricao,
                'codigo': codigo,
                'estoque_inicial': estoque_inicial,
                'vendas': vendas,
                'estoque_final': estoque_final,
                'estoque_esperado': estoque_esperado,
                'discrepancia': discrepancia,
                'status': status,
                'tipo_discrepancia': tipo_discrepancia,
                'tolerancia': tolerancia
            }
            
            resultados.append(resultado)
            
            # Log do resultado
            logger.info(f"📊 {descricao}:")
            logger.info(f"   Inicial: {estoque_inicial}, Vendas: {vendas}")
            logger.info(f"   Esperado: {estoque_esperado}, Final: {estoque_final}")
            logger.info(f"   Discrepância: {discrepancia} ({status})")
            
        except Exception as e:
            logger.error(f"❌ Erro ao calcular discrepância para {produto.get('descricao', 'produto')}: {str(e)}")
            
            # Criar resultado com erro
            resultado = {
                'produto': produto.get('descricao', 'PRODUTO_DESCONHECIDO'),
                'codigo': produto.get('codigo', ''),
                'estoque_inicial': 0.0,
                'vendas': produto.get('vendas', 0.0),
                'estoque_final': 0.0,
                'estoque_esperado': 0.0,
                'discrepancia': 0.0,
                'status': 'ERRO',
                'tipo_discrepancia': 'Erro no cálculo',
                'tolerancia': tolerancia
            }
            resultados.append(resultado)
    
    # Estatísticas finais
    produtos_ok = [r for r in resultados if r['status'] == 'OK']
    produtos_erro = [r for r in resultados if r['status'] == 'ERRO']
    
    logger.info(f"📊 RESUMO FINAL:")
    logger.info(f"   ✅ Produtos OK: {len(produtos_ok)}")
    logger.info(f"   ❌ Produtos com ERRO: {len(produtos_erro)}")
    logger.info(f"   📈 Tolerância utilizada: {tolerancia}")
    
    if produtos_erro:
        logger.info("🚨 Produtos com discrepância:")
        for produto in produtos_erro:
            logger.info(f"   - {produto['produto']}: {produto['discrepancia']} unidades ({produto['tipo_discrepancia']})")
    
    return resultados


def gerar_relatorio_discrepancias(resultados: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Gera um relatório resumido das discrepâncias.
    
    Args:
        resultados: Lista de resultados de discrepâncias
        
    Returns:
        Dicionário com relatório resumido
    """
    logger.info("📋 Gerando relatório de discrepâncias...")
    
    # Estatísticas básicas
    total_produtos = len(resultados)
    produtos_ok = [r for r in resultados if r['status'] == 'OK']
    produtos_erro = [r for r in resultados if r['status'] == 'ERRO']
    
    # Análise por tipo de discrepância
    estoque_excedente = [r for r in produtos_erro if r['discrepancia'] > 0]
    estoque_faltante = [r for r in produtos_erro if r['discrepancia'] < 0]
    
    # Valores totais
    total_discrepancia = sum(abs(r['discrepancia']) for r in produtos_erro)
    total_vendas = sum(r['vendas'] for r in resultados)
    total_estoque_inicial = sum(r['estoque_inicial'] for r in resultados)
    total_estoque_final = sum(r['estoque_final'] for r in resultados)
    
    # Produtos com maior discrepância
    produtos_maior_discrepancia = sorted(
        produtos_erro, 
        key=lambda x: abs(x['discrepancia']), 
        reverse=True
    )[:5]
    
    relatorio = {
        'resumo_geral': {
            'total_produtos': total_produtos,
            'produtos_ok': len(produtos_ok),
            'produtos_erro': len(produtos_erro),
            'percentual_erro': (len(produtos_erro) / total_produtos * 100) if total_produtos > 0 else 0
        },
        'analise_discrepancias': {
            'estoque_excedente': len(estoque_excedente),
            'estoque_faltante': len(estoque_faltante),
            'total_discrepancia': total_discrepancia
        },
        'valores_totais': {
            'total_vendas': total_vendas,
            'total_estoque_inicial': total_estoque_inicial,
            'total_estoque_final': total_estoque_final
        },
        'produtos_maior_discrepancia': [
            {
                'produto': p['produto'],
                'discrepancia': p['discrepancia'],
                'tipo': p['tipo_discrepancia']
            }
            for p in produtos_maior_discrepancia
        ],
        'recomendacoes': gerar_recomendacoes(produtos_erro, total_discrepancia)
    }
    
    logger.info("✅ Relatório gerado com sucesso")
    return relatorio


def gerar_recomendacoes(produtos_erro: List[Dict[str, Any]], total_discrepancia: float) -> List[str]:
    """
    Gera recomendações baseadas nas discrepâncias encontradas.
    
    Args:
        produtos_erro: Lista de produtos com erro
        total_discrepancia: Total de discrepância
        
    Returns:
        Lista de recomendações
    """
    recomendacoes = []
    
    if len(produtos_erro) == 0:
        recomendacoes.append("✅ Sistema fiscal em conformidade - nenhuma discrepância encontrada")
        return recomendacoes
    
    # Análise de quantidade de erros
    if len(produtos_erro) <= 2:
        recomendacoes.append("⚠️ Poucas discrepâncias encontradas - verificar se são erros pontuais")
    elif len(produtos_erro) <= 5:
        recomendacoes.append("⚠️ Discrepâncias moderadas - revisar processos de controle de estoque")
    else:
        recomendacoes.append("🚨 Muitas discrepâncias - necessário auditoria completa do sistema fiscal")
    
    # Análise de valor total
    if total_discrepancia > 1000:
        recomendacoes.append("🚨 Alto valor de discrepância - priorizar investigação")
    elif total_discrepancia > 100:
        recomendacoes.append("⚠️ Discrepância significativa - revisar controles")
    else:
        recomendacoes.append("ℹ️ Discrepância baixa - monitorar tendências")
    
    # Análise por tipo
    estoque_excedente = [p for p in produtos_erro if p['discrepancia'] > 0]
    estoque_faltante = [p for p in produtos_erro if p['discrepancia'] < 0]
    
    if len(estoque_excedente) > len(estoque_faltante):
        recomendacoes.append("📦 Mais produtos com estoque excedente - verificar entradas não declaradas")
    elif len(estoque_faltante) > len(estoque_excedente):
        recomendacoes.append("📉 Mais produtos com estoque faltante - verificar vendas não declaradas")
    
    return recomendacoes


if __name__ == "__main__":
    # Teste do módulo
    print("🧪 Testando módulo discrepancia...")
    
    # Exemplo de dados de teste
    produtos_teste = [
        {
            'codigo': '001',
            'descricao': 'PRODUTO_A',
            'vendas': 100.0,
            'estoque_inicial': 200.0,
            'estoque_final': 80.0
        },
        {
            'codigo': '002',
            'descricao': 'PRODUTO_B',
            'vendas': 50.0,
            'estoque_inicial': 100.0,
            'estoque_final': 60.0
        }
    ]
    
    try:
        # Calcular discrepâncias
        resultados = calcular_discrepancias(produtos_teste, tolerancia=1.0)
        print(f"✅ Teste concluído: {len(resultados)} produtos processados")
        
        # Gerar relatório
        relatorio = gerar_relatorio_discrepancias(resultados)
        print(f"✅ Relatório gerado: {relatorio['resumo_geral']['produtos_erro']} erros encontrados")
        
    except Exception as e:
        print(f"❌ Erro no teste: {str(e)}") 