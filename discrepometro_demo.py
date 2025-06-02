#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🎯 DISCREPÔMETRO DEMO - Versão de Demonstração
=============================================

Esta é uma versão de demonstração que funciona com dados CSV para mostrar
como o sistema detecta compras/vendas sem nota através da análise CFOP.

💡 COMO USAR:
- Execute: python3 discrepometro_demo.py
- Usará os arquivos de exemplo já criados
"""

import pandas as pd
from supabase import create_client
from datetime import datetime

# Configuração do Supabase
SUPABASE_URL = 'https://hvjjcegcdivumprqviug.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def classificar_cfop(cfop):
    """Classifica CFOP como ENTRADA (compra) ou SAÍDA (venda)"""
    cfop_str = str(cfop).replace(".", "").replace(" ", "")
    
    if len(cfop_str) >= 1:
        primeiro_digito = cfop_str[0]
        if primeiro_digito in ['1', '2', '3']:
            return 'ENTRADA'  # Compra com nota
        elif primeiro_digito in ['5', '6', '7']:
            return 'SAIDA'    # Venda com nota
    
    return 'DESCONHECIDO'

def ler_inventario_csv():
    """Lê dados de inventário do CSV"""
    print("📊 Lendo inventário completo...")
    
    try:
        df = pd.read_csv('inventario_completo.csv')
        print(f"   ✅ {len(df)} produtos de inventário carregados")
        
        inventario = {}
        for _, row in df.iterrows():
            codigo = str(row['Código'])
            inventario[codigo] = {
                'produto': row['Produto'],
                'inicial': int(row['Estoque Inicial']),
                'final': int(row['Estoque Final'])
            }
        
        return inventario
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        return {}

def ler_transacoes_fiscais():
    """Lê transações fiscais dos CSVs disponíveis"""
    print("📊 Lendo transações fiscais...")
    
    arquivos = ['test_fiscal.csv', 'dados_exemplo_fiscal.csv']
    todas_transacoes = {}
    
    for arquivo in arquivos:
        try:
            print(f"   🔍 Processando: {arquivo}")
            df = pd.read_csv(arquivo)
            
            for _, row in df.iterrows():
                codigo = str(row['Mercadoria - Código'])
                quantidade = float(row['Mercadoria - Qtde'])
                cfop = str(row['CFOP'])
                produto = str(row['Mercadoria - Descrição'])
                
                tipo_movimento = classificar_cfop(cfop)
                
                if codigo not in todas_transacoes:
                    todas_transacoes[codigo] = {
                        'produto': produto,
                        'entradas': 0,
                        'saidas': 0,
                        'cfops': []
                    }
                
                if tipo_movimento == 'ENTRADA':
                    todas_transacoes[codigo]['entradas'] += quantidade
                elif tipo_movimento == 'SAIDA':
                    todas_transacoes[codigo]['saidas'] += quantidade
                
                todas_transacoes[codigo]['cfops'].append(cfop)
            
            print(f"   ✅ {arquivo}: {len(df)} registros processados")
            
        except Exception as e:
            print(f"   ⚠️ Erro em {arquivo}: {e}")
    
    print(f"   📈 Total: {len(todas_transacoes)} produtos únicos")
    return todas_transacoes

def calcular_discrepancias(inventario, transacoes):
    """Calcula discrepâncias usando a fórmula solicitada"""
    print("\n🧮 APLICANDO A FÓRMULA DE CÁLCULO...")
    print("   📐 esperado = estoque_inicial + entradas - saidas")
    
    resultados = []
    
    # Combinar todos os produtos
    todos_produtos = set()
    todos_produtos.update(inventario.keys())
    todos_produtos.update(transacoes.keys())
    
    for codigo in todos_produtos:
        # Dados do inventário
        dados_inv = inventario.get(codigo, {'inicial': 0, 'final': 0, 'produto': f'PRODUTO_{codigo}'})
        
        # Dados das transações
        dados_tx = transacoes.get(codigo, {'entradas': 0, 'saidas': 0, 'produto': f'PRODUTO_{codigo}', 'cfops': []})
        
        # Valores para cálculo
        estoque_inicial = dados_inv['inicial']
        estoque_final = dados_inv['final']
        entradas = dados_tx['entradas']
        saidas = dados_tx['saidas']
        
        # 🧮 FÓRMULA PRINCIPAL (conforme solicitado)
        estoque_esperado = estoque_inicial + entradas - saidas
        
        # Calcular diferença
        diferenca = abs(estoque_final - estoque_esperado)
        
        # Determinar status (margem de 1 unidade)
        if diferenca <= 1:
            status = 'OK'
            discrepancia_tipo = 'Sem Discrepância'
        else:
            status = 'ERRO'
            if estoque_final > estoque_esperado:
                discrepancia_tipo = 'Estoque Excedente'
            else:
                discrepancia_tipo = 'Estoque Faltante'
        
        # Nome do produto
        produto_nome = dados_inv.get('produto') or dados_tx.get('produto')
        
        # Mostrar cálculo detalhado para os primeiros produtos
        if len(resultados) < 3:
            print(f"\n   📝 Exemplo de cálculo - {produto_nome}:")
            print(f"      🔢 Inicial: {estoque_inicial}")
            print(f"      ⬆️  Entradas: {entradas}")
            print(f"      ⬇️  Saídas: {saidas}")
            print(f"      🎯 Esperado: {estoque_inicial} + {entradas} - {saidas} = {estoque_esperado}")
            print(f"      📦 Real: {estoque_final}")
            print(f"      ❓ Diferença: {diferenca}")
            print(f"      ✅ Status: {status}")
        
        # Formatar dados conforme schema da tabela analise_discrepancia
        resultado = {
            'produto': produto_nome,
            'codigo': codigo,
            'cfop': ', '.join(dados_tx.get('cfops', [])) if dados_tx.get('cfops') else None,
            'valor_unitario': 0.0,  # Não temos dados de valor por enquanto
            'valor_total': 0.0,     # Não temos dados de valor por enquanto
            'entradas': int(entradas),
            'saidas': int(saidas),
            'est_inicial': int(estoque_inicial),
            'est_final': int(estoque_final),
            'est_calculado': int(estoque_esperado),
            'discrepancia_tipo': discrepancia_tipo,
            'discrepancia_valor': int(diferenca),
            'observacoes': f"Fórmula: {estoque_inicial} + {entradas} - {saidas} = {estoque_esperado}. Status: {status}",
            'ano': 2024,
            'user_id': None
        }
        
        resultados.append(resultado)
    
    # Estatísticas
    total = len(resultados)
    ok_count = sum(1 for r in resultados if r['discrepancia_tipo'] == 'Sem Discrepância')
    erro_count = total - ok_count
    
    print(f"\n   📊 RESULTADO DA ANÁLISE:")
    print(f"      🔢 Total analisado: {total} produtos")
    print(f"      ✅ OK (diferença ≤ 1): {ok_count} produtos")
    print(f"      ❌ ERRO (diferença > 1): {erro_count} produtos")
    
    return resultados

def mostrar_relatorio_detalhado(resultados):
    """Mostra relatório detalhado das discrepâncias"""
    print("\n📋 RELATÓRIO DETALHADO DE DISCREPÂNCIAS")
    print("=" * 80)
    
    erros = [r for r in resultados if r['discrepancia_tipo'] != 'Sem Discrepância']
    
    if not erros:
        print("✅ PARABÉNS! Nenhuma discrepância significativa encontrada!")
        print("   Todos os produtos estão dentro da margem de 1 unidade.")
        return
    
    print(f"❌ ENCONTRADAS {len(erros)} DISCREPÂNCIAS:")
    print()
    
    for i, erro in enumerate(erros, 1):
        print(f"{i}. {erro['produto']} (Código: {erro['codigo']})")
        print(f"   📐 Cálculo: {erro['est_inicial']} + {erro['entradas']} - {erro['saidas']} = {erro['est_calculado']}")
        print(f"   📦 Estoque Real: {erro['est_final']}")
        print(f"   ⚠️  Diferença: {erro['discrepancia_valor']} unidades")
        print(f"   🏷️  CFOPs usados: {erro['cfop']}")
        print()
        
        # Interpretação da discrepância
        if erro['discrepancia_tipo'] == 'Estoque Excedente':
            print(f"   💡 INTERPRETAÇÃO: Estoque maior que esperado")
            print(f"      Possível COMPRA SEM NOTA de {erro['discrepancia_valor']} unidades")
        elif erro['discrepancia_tipo'] == 'Estoque Faltante':
            print(f"   💡 INTERPRETAÇÃO: Estoque menor que esperado")
            print(f"      Possível VENDA SEM NOTA de {erro['discrepancia_valor']} unidades")
        print("-" * 80)

def salvar_no_supabase(resultados):
    """Salva resultados no Supabase na tabela correta"""
    if not resultados:
        print("⚠️ Nenhum resultado para salvar")
        return
    
    try:
        print(f"\n💾 Salvando {len(resultados)} registros no Supabase...")
        
        # Limpar dados anteriores na tabela correta
        supabase.table('analise_discrepancia').delete().neq('id', 0).execute()
        print("   🗑️ Dados anteriores limpos")
        
        # Inserir novos dados
        supabase.table('analise_discrepancia').insert(resultados).execute()
        print(f"   ✅ {len(resultados)} registros salvos com sucesso!")
        
    except Exception as e:
        print(f"   ❌ Erro ao salvar: {e}")

def main():
    """Executa a demonstração do Discrepômetro"""
    
    print("🎯 DISCREPÔMETRO DEMO - DEMONSTRAÇÃO")
    print("=" * 60)
    print("📖 Este demo mostra como detectar compras/vendas sem nota")
    print("   através da análise de CFOPs vs estoque real")
    print()
    
    # Ler dados
    inventario = ler_inventario_csv()
    transacoes = ler_transacoes_fiscais()
    
    if not inventario or not transacoes:
        print("❌ Erro: Dados insuficientes para análise")
        return
    
    # Calcular discrepâncias
    resultados = calcular_discrepancias(inventario, transacoes)
    
    # Mostrar relatório
    mostrar_relatorio_detalhado(resultados)
    
    # Salvar no Supabase
    salvar_no_supabase(resultados)
    
    print("\n🎉 DEMONSTRAÇÃO CONCLUÍDA!")
    print("   📊 Dados salvos na tabela 'analise_discrepancia' do Supabase")
    print("   🔍 Agora você pode visualizar os resultados no seu dashboard")

if __name__ == "__main__":
    main() 