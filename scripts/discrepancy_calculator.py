#!/usr/bin/env python3
"""
Módulo para cálculo de discrepâncias entre vendas e inventários
"""

import logging
from typing import List, Dict, Any
import pandas as pd

logger = logging.getLogger(__name__)

def calcular_discrepancias_top10(produtos_top10: pd.DataFrame, inventarios: Dict[str, Dict]) -> List[Dict]:
    """
    Calcula discrepâncias entre produtos vendidos e inventários
    """
    logger.info("🔍 Calculando discrepâncias dos top 10 produtos...")
    
    discrepancias = []
    
    for _, produto in produtos_top10.iterrows():
        nome_produto = produto['produto']
        quantidade_vendida = produto['quantidade']
        
        logger.info(f"📊 Analisando: {nome_produto} - Vendido: {quantidade_vendida}")
        
        # Buscar no inventário 2023
        inventario_2023 = inventarios.get('2023', {}).get(nome_produto, {})
        quantidade_2023 = inventario_2023.get('quantidade', 0) if inventario_2023.get('encontrado') else 0
        
        # Buscar no inventário 2024
        inventario_2024 = inventarios.get('2024', {}).get(nome_produto, {})
        quantidade_2024 = inventario_2024.get('quantidade', 0) if inventario_2024.get('encontrado') else 0
        
        # Calcular diferença
        diferenca = quantidade_2024 - quantidade_2023 - quantidade_vendida
        
        # Determinar status
        status = determinar_status_discrepancia(quantidade_vendida, quantidade_2023, quantidade_2024)
        
        # Criar registro de discrepância
        discrepancia = {
            'produto': nome_produto,
            'codigo': produto.get('codigo', ''),
            'quantidade_vendida': quantidade_vendida,
            'quantidade_inventario_2023': quantidade_2023,
            'quantidade_inventario_2024': quantidade_2024,
            'diferenca': diferenca,
            'status': status,
            'valor_total_vendido': produto.get('valor_total', 0),
            'cfops_utilizados': produto.get('cfop', [])
        }
        
        discrepancias.append(discrepancia)
        
        logger.info(f"  📈 Resultado: {status} - Diferença: {diferenca}")
    
    return discrepancias

def determinar_status_discrepancia(quantidade_vendida: float, quantidade_2023: float, quantidade_2024: float) -> str:
    """
    Determina o status da discrepância baseado nas quantidades
    """
    # Se não encontrou no inventário 2023
    if quantidade_2023 == 0:
        return "CRÍTICO"
    
    # Se não encontrou no inventário 2024
    if quantidade_2024 == 0:
        return "CRÍTICO"
    
    # Calcular diferença esperada
    diferenca_esperada = quantidade_2024 - quantidade_2023 - quantidade_vendida
    
    # Se a diferença é muito grande (mais de 10% da quantidade vendida)
    if abs(diferenca_esperada) > (quantidade_vendida * 0.1):
        if diferenca_esperada < 0:
            return "CRÍTICO"  # Vendeu mais do que tinha
        else:
            return "ALERTA"   # Sobrou muito estoque
    
    # Se a diferença é pequena
    return "OK"

def gerar_estatisticas_discrepancias(discrepancias: List[Dict]) -> Dict[str, Any]:
    """
    Gera estatísticas das discrepâncias encontradas
    """
    logger.info("📊 Gerando estatísticas das discrepâncias...")
    
    total_produtos = len(discrepancias)
    criticos = len([d for d in discrepancias if d['status'] == 'CRÍTICO'])
    alertas = len([d for d in discrepancias if d['status'] == 'ALERTA'])
    ok = len([d for d in discrepancias if d['status'] == 'OK'])
    
    # Calcular valores totais
    valor_total_vendido = sum(d.get('valor_total_vendido', 0) for d in discrepancias)
    quantidade_total_vendida = sum(d.get('quantidade_vendida', 0) for d in discrepancias)
    
    # Produtos mais críticos
    produtos_criticos = [d for d in discrepancias if d['status'] == 'CRÍTICO']
    produtos_criticos.sort(key=lambda x: abs(x.get('diferenca', 0)), reverse=True)
    
    estatisticas = {
        'total_produtos': total_produtos,
        'criticos': criticos,
        'alertas': alertas,
        'ok': ok,
        'percentual_critico': round((criticos / total_produtos) * 100, 2) if total_produtos > 0 else 0,
        'percentual_alerta': round((alertas / total_produtos) * 100, 2) if total_produtos > 0 else 0,
        'percentual_ok': round((ok / total_produtos) * 100, 2) if total_produtos > 0 else 0,
        'valor_total_vendido': valor_total_vendido,
        'quantidade_total_vendida': quantidade_total_vendida,
        'produtos_criticos': produtos_criticos[:5]  # Top 5 mais críticos
    }
    
    logger.info(f"📈 Estatísticas:")
    logger.info(f"  - Total: {total_produtos}")
    logger.info(f"  - Críticos: {criticos} ({estatisticas['percentual_critico']}%)")
    logger.info(f"  - Alertas: {alertas} ({estatisticas['percentual_alerta']}%)")
    logger.info(f"  - OK: {ok} ({estatisticas['percentual_ok']}%)")
    
    return estatisticas

def formatar_relatorio_json(discrepancias: List[Dict]) -> List[Dict]:
    """
    Formata as discrepâncias para o formato JSON esperado pelo frontend
    """
    logger.info("📋 Formatando relatório para JSON...")
    
    relatorio_formatado = []
    
    for discrepancia in discrepancias:
        item_formatado = {
            'produto': discrepancia['produto'],
            'quantidade_vendida': int(discrepancia['quantidade_vendida']),
            'quantidade_inventario': int(discrepancia['quantidade_inventario_2024']),
            'diferenca': int(discrepancia['diferenca']),
            'status': discrepancia['status'],
            'codigo': discrepancia.get('codigo', ''),
            'valor_total_vendido': float(discrepancia.get('valor_total_vendido', 0)),
            'cfops_utilizados': discrepancia.get('cfops_utilizados', [])
        }
        
        relatorio_formatado.append(item_formatado)
    
    logger.info(f"✅ Relatório formatado: {len(relatorio_formatado)} itens")
    return relatorio_formatado

if __name__ == "__main__":
    # Teste do módulo
    import sys
    
    if len(sys.argv) != 2:
        print("Uso: python discrepancy_calculator.py <arquivo_json>")
        sys.exit(1)
    
    # Simular dados de teste
    produtos_teste = pd.DataFrame({
        'produto': ['Produto A', 'Produto B', 'Produto C'],
        'codigo': ['A001', 'B002', 'C003'],
        'quantidade': [100, 50, 200],
        'valor_total': [1000, 500, 2000],
        'cfop': [['5101'], ['6101'], ['5405']]
    })
    
    inventarios_teste = {
        '2023': {
            'Produto A': {'quantidade': 150, 'encontrado': True},
            'Produto B': {'quantidade': 0, 'encontrado': False},
            'Produto C': {'quantidade': 300, 'encontrado': True}
        },
        '2024': {
            'Produto A': {'quantidade': 50, 'encontrado': True},
            'Produto B': {'quantidade': 0, 'encontrado': False},
            'Produto C': {'quantidade': 100, 'encontrado': True}
        }
    }
    
    discrepancias = calcular_discrepancias_top10(produtos_teste, inventarios_teste)
    estatisticas = gerar_estatisticas_discrepancias(discrepancias)
    
    print(f"Resultado: {len(discrepancias)} discrepâncias calculadas")
    print(f"Críticos: {estatisticas['criticos']}")
    print(f"Alertas: {estatisticas['alertas']}")
    print(f"OK: {estatisticas['ok']}") 