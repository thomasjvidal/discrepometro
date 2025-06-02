#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🎯 DISCREPÔMETRO FINAL - Versão Simplificada e Funcional
====================================================

Este script faz exatamente o que você pediu:
1. Lê planilhas fiscais (CFOP) e PDFs de inventário
2. Classifica CFOPs como entradas/saídas (compras/vendas com nota)
3. Calcula estoque esperado vs real
4. Detecta compras/vendas sem nota
5. Salva resultados no Supabase

💡 COMO USAR:
- Coloque seus arquivos na mesma pasta que este script
- Execute: python discrepometro_final.py
- Os resultados serão salvos automaticamente no Supabase

🔧 ARQUIVOS SUPORTADOS:
- PDFs: inventário inicial e final
- Excel/CSV: planilhas fiscais com CFOP
"""

import os
import pandas as pd
import pdfplumber
import re
from supabase import create_client
from datetime import datetime
import glob

# =========================================
# 1️⃣ CONFIGURAÇÃO DO SUPABASE
# =========================================

# Configurar Supabase (usando as credenciais já configuradas)
SUPABASE_URL = 'https://hvjjcegcdivumprqviug.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# =========================================
# 2️⃣ CLASSIFICAÇÃO DOS CFOPs
# =========================================

def classificar_cfop(cfop):
    """
    Classifica um CFOP como ENTRADA (compra com nota) ou SAÍDA (venda com nota)
    
    🧠 LÓGICA SIMPLES:
    - CFOPs que começam com 1, 2, 3 = ENTRADAS (compras)
    - CFOPs que começam com 5, 6, 7 = SAÍDAS (vendas)
    """
    cfop_str = str(cfop).strip()
    
    # Remover pontos e espaços (ex: "1.102" vira "1102")
    cfop_limpo = cfop_str.replace(".", "").replace(" ", "")
    
    if len(cfop_limpo) >= 1:
        primeiro_digito = cfop_limpo[0]
        
        if primeiro_digito in ['1', '2', '3']:
            return 'ENTRADA'  # Compra com nota
        elif primeiro_digito in ['5', '6', '7']:
            return 'SAIDA'    # Venda com nota
    
    return 'DESCONHECIDO'

# =========================================
# 3️⃣ LEITURA DE ARQUIVOS PDF (INVENTÁRIO)
# =========================================

def ler_pdf_inventario(caminho_pdf):
    """
    Lê um PDF de inventário e extrai: código, nome do produto, quantidade
    
    📄 FORMATOS SUPORTADOS:
    - "001 - PRODUTO NOME - 50"
    - "Código: 001 Produto: NOME Qtd: 50"
    - E vários outros padrões automáticos
    """
    inventario = {}
    
    print(f"📄 Lendo PDF: {caminho_pdf}")
    
    # Padrões de regex para diferentes formatos de PDF
    padroes = [
        r'(\d+)\s*-\s*([^-]+)\s*-\s*(\d+)',           # 001 - PRODUTO - 50
        r'Código:\s*(\d+).*?Produto:\s*(.+?).*?Qtd:\s*(\d+)',  # Código: 001 Produto: NOME Qtd: 50
        r'(\d+)\s*\|\s*(.+?)\s*\|\s*(\d+)',           # 001 | PRODUTO | 50
        r'(\d+);(.+?);(\d+)',                         # 001;PRODUTO;50
        r'(\d+)\s+([A-Za-z0-9\s]{3,})\s+(\d+)$',     # 001 PRODUTO NOME 50
    ]
    
    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            produtos_encontrados = 0
            
            for num_pagina, pagina in enumerate(pdf.pages):
                texto = pagina.extract_text() or ""
                
                # Tentar cada padrão até encontrar um que funcione
                for i, padrao in enumerate(padroes):
                    matches = re.finditer(padrao, texto, re.MULTILINE)
                    matches_list = list(matches)
                    
                    if matches_list:
                        print(f"   ✅ Página {num_pagina + 1}: Padrão {i + 1} encontrou {len(matches_list)} produtos")
                        
                        for match in matches_list:
                            codigo = match.group(1).strip()
                            produto = match.group(2).strip()
                            quantidade = int(match.group(3))
                            
                            inventario[codigo] = {
                                'produto': produto,
                                'quantidade': quantidade,
                                'fonte': os.path.basename(caminho_pdf)
                            }
                            produtos_encontrados += 1
                        
                        break  # Usar apenas o primeiro padrão que funcionar
            
            print(f"   📦 Total extraído: {produtos_encontrados} produtos")
            return inventario
            
    except Exception as e:
        print(f"   ❌ Erro ao ler PDF: {e}")
        return {}

# =========================================
# 4️⃣ LEITURA DE PLANILHAS (TRANSAÇÕES FISCAIS)
# =========================================

def ler_planilha_fiscal(caminho_planilha):
    """
    Lê uma planilha fiscal e extrai: código, produto, quantidade, CFOP, tipo
    
    📊 COLUNAS DETECTADAS AUTOMATICAMENTE:
    - Código/SKU/Item
    - Produto/Descrição/Mercadoria
    - Quantidade/Qtd
    - CFOP
    """
    transacoes = {}
    
    print(f"📊 Lendo planilha: {caminho_planilha}")
    
    try:
        # Ler arquivo baseado na extensão
        if caminho_planilha.lower().endswith('.csv'):
            df = pd.read_csv(caminho_planilha, encoding='utf-8')
        else:
            df = pd.read_excel(caminho_planilha)
        
        print(f"   📋 {len(df)} linhas, {len(df.columns)} colunas")
        print(f"   🔍 Colunas disponíveis: {list(df.columns)}")
        
        # Detectar colunas automaticamente
        colunas = {}
        for col in df.columns:
            col_lower = str(col).lower()
            
            # Detectar coluna de código
            if any(termo in col_lower for termo in ['codigo', 'código', 'cod', 'sku', 'item']):
                colunas['codigo'] = col
            
            # Detectar coluna de produto
            if any(termo in col_lower for termo in ['produto', 'descrição', 'descricao', 'mercadoria', 'desc']):
                colunas['produto'] = col
            
            # Detectar coluna de quantidade
            if any(termo in col_lower for termo in ['quantidade', 'qtd', 'qtde']):
                colunas['quantidade'] = col
            
            # Detectar coluna de CFOP
            if 'cfop' in col_lower:
                colunas['cfop'] = col
        
        print(f"   🎯 Mapeamento: {colunas}")
        
        if not all(k in colunas for k in ['codigo', 'quantidade', 'cfop']):
            print("   ❌ Colunas obrigatórias não encontradas")
            return {}
        
        # Processar cada linha
        for _, linha in df.iterrows():
            try:
                codigo = str(linha[colunas['codigo']]).strip()
                quantidade = float(linha[colunas['quantidade']])
                cfop = str(linha[colunas['cfop']]).strip()
                produto = str(linha.get(colunas.get('produto', ''), f'PRODUTO_{codigo}')).strip()
                
                if not codigo or codigo == 'nan':
                    continue
                
                # Classificar CFOP
                tipo_movimento = classificar_cfop(cfop)
                
                # Inicializar produto se não existir
                if codigo not in transacoes:
                    transacoes[codigo] = {
                        'produto': produto,
                        'entradas': 0,
                        'saidas': 0,
                        'cfops': []
                    }
                
                # Somar quantidades por tipo
                if tipo_movimento == 'ENTRADA':
                    transacoes[codigo]['entradas'] += quantidade
                elif tipo_movimento == 'SAIDA':
                    transacoes[codigo]['saidas'] += quantidade
                
                # Guardar CFOP para referência
                transacoes[codigo]['cfops'].append(cfop)
                
            except Exception as e:
                print(f"   ⚠️ Erro na linha: {e}")
                continue
        
        print(f"   ✅ Processados {len(transacoes)} produtos únicos")
        return transacoes
        
    except Exception as e:
        print(f"   ❌ Erro ao ler planilha: {e}")
        return {}

# =========================================
# 5️⃣ CÁLCULO DO ESTOQUE ESPERADO
# =========================================

def calcular_estoque_esperado(inventario_inicial, inventario_final, transacoes):
    """
    Calcula o estoque esperado e detecta discrepâncias
    
    🧮 FÓRMULA APLICADA:
    estoque_esperado = estoque_inicial + entradas - saidas
    
    ❌ DISCREPÂNCIA = |estoque_real - estoque_esperado| > 1
    """
    resultados = []
    
    print("🧮 Calculando discrepâncias...")
    
    # Combinar todos os produtos (inventário + transações)
    todos_produtos = set()
    todos_produtos.update(inventario_inicial.keys())
    todos_produtos.update(inventario_final.keys())
    todos_produtos.update(transacoes.keys())
    
    for codigo in todos_produtos:
        # Dados do inventário
        dados_inicial = inventario_inicial.get(codigo, {'quantidade': 0, 'produto': f'PRODUTO_{codigo}'})
        dados_final = inventario_final.get(codigo, {'quantidade': 0, 'produto': f'PRODUTO_{codigo}'})
        
        # Dados das transações
        dados_tx = transacoes.get(codigo, {'entradas': 0, 'saidas': 0, 'produto': f'PRODUTO_{codigo}', 'cfops': []})
        
        # Valores para cálculo
        estoque_inicial = dados_inicial['quantidade']
        estoque_final = dados_final['quantidade']
        entradas = dados_tx['entradas']
        saidas = dados_tx['saidas']
        
        # 🧮 FÓRMULA PRINCIPAL
        estoque_esperado = estoque_inicial + entradas - saidas
        
        # Calcular diferença
        diferenca = abs(estoque_final - estoque_esperado)
        
        # Determinar status (margem de 1 unidade como solicitado)
        if diferenca <= 1:
            status = 'OK'
        else:
            status = 'ERRO'
        
        # Nome do produto (priorizar inventário final, depois inicial, depois transações)
        produto_nome = (dados_final.get('produto') or 
                       dados_inicial.get('produto') or 
                       dados_tx.get('produto'))
        
        resultado = {
            'produto': produto_nome,
            'codigo': codigo,
            'estoque_inicial': int(estoque_inicial),
            'entradas': int(entradas),
            'saidas': int(saidas),
            'estoque_esperado': int(estoque_esperado),
            'estoque_real': int(estoque_final),
            'diferenca': int(diferenca),
            'status': status,
            'cfops_usados': ', '.join(dados_tx.get('cfops', [])),
            'data_analise': datetime.now().isoformat(),
            'observacoes': f"Inicial: {estoque_inicial}, Entradas: {entradas}, Saídas: {saidas}"
        }
        
        resultados.append(resultado)
    
    # Mostrar estatísticas
    total = len(resultados)
    ok_count = sum(1 for r in resultados if r['status'] == 'OK')
    erro_count = total - ok_count
    
    print(f"   📊 Total analisado: {total} produtos")
    print(f"   ✅ OK: {ok_count} produtos")
    print(f"   ❌ ERRO: {erro_count} produtos")
    
    return resultados

# =========================================
# 6️⃣ ENVIO PARA SUPABASE
# =========================================

def salvar_no_supabase(resultados):
    """Salva os resultados na tabela 'analise_discrepancia' do Supabase"""
    
    if not resultados:
        print("⚠️ Nenhum resultado para salvar")
        return
    
    try:
        print(f"💾 Salvando {len(resultados)} registros no Supabase...")
        
        # Adaptar dados para o formato correto da tabela
        dados_supabase = []
        for r in resultados:
            # Determinar tipo de discrepância
            if r['diferenca'] <= 1:
                discrepancia_tipo = 'Sem Discrepância'
            elif r['estoque_real'] > r['estoque_esperado']:
                discrepancia_tipo = 'Estoque Excedente'
            else:
                discrepancia_tipo = 'Estoque Faltante'
                
            dados_supabase.append({
                'produto': r['produto'],
                'codigo': r['codigo'],
                'cfop': r.get('cfops_usados'),
                'valor_unitario': 0.0,
                'valor_total': 0.0,
                'entradas': r['entradas'],
                'saidas': r['saidas'],
                'est_inicial': r['estoque_inicial'],
                'est_final': r['estoque_real'],
                'est_calculado': r['estoque_esperado'],
                'discrepancia_tipo': discrepancia_tipo,
                'discrepancia_valor': r['diferenca'],
                'observacoes': r['observacoes'],
                'ano': 2024,
                'user_id': None
            })
        
        # Limpar dados anteriores
        print("   🗑️ Limpando dados anteriores...")
        supabase.table('analise_discrepancia').delete().neq('id', 0).execute()
        
        # Inserir novos dados em lotes de 50
        batch_size = 50
        for i in range(0, len(dados_supabase), batch_size):
            batch = dados_supabase[i:i + batch_size]
            supabase.table('analise_discrepancia').insert(batch).execute()
            print(f"   ✅ Lote {i//batch_size + 1}: {len(batch)} registros salvos")
        
        print(f"🎉 Sucesso! {len(dados_supabase)} registros salvos no Supabase")
        
    except Exception as e:
        print(f"❌ Erro ao salvar no Supabase: {e}")
        print("💡 Verifique se a tabela 'analise_discrepancia' existe e tem as colunas corretas")

# =========================================
# 7️⃣ FUNÇÃO PRINCIPAL
# =========================================

def main():
    """Executa todo o processo do Discrepômetro"""
    
    print("🎯 DISCREPÔMETRO FINAL - INICIANDO")
    print("=" * 50)
    
    # Buscar arquivos na pasta atual
    pdfs = glob.glob("*.pdf")
    planilhas = glob.glob("*.xlsx") + glob.glob("*.xls") + glob.glob("*.csv")
    
    print(f"📁 Arquivos encontrados:")
    print(f"   📄 PDFs: {len(pdfs)} - {pdfs}")
    print(f"   📊 Planilhas: {len(planilhas)} - {planilhas}")
    
    # Verificar se temos o arquivo de inventário CSV como alternativa
    inventario_csv = 'inventario_completo.csv'
    tem_inventario_csv = os.path.exists(inventario_csv)
    
    if len(pdfs) < 2 and not tem_inventario_csv:
        print("❌ ERRO: Precisamos de:")
        print("   • 2 PDFs de inventário (inicial e final)")
        print("   • OU arquivo 'inventario_completo.csv' com estoque inicial e final")
        return
    
    if len(planilhas) < 1:
        print("❌ ERRO: Precisamos de pelo menos 1 planilha fiscal")
        return
    
    # ===================================
    # PASSO 1: Ler inventários
    # ===================================
    print("\n🔄 PASSO 1: Lendo inventários...")
    
    inventario_inicial = {}
    inventario_final = {}
    
    if tem_inventario_csv:
        print(f"📊 Usando arquivo CSV de inventário: {inventario_csv}")
        try:
            df = pd.read_csv(inventario_csv)
            for _, row in df.iterrows():
                codigo = str(row['Código'])
                produto = row['Produto']
                inicial = int(row['Estoque Inicial'])
                final = int(row['Estoque Final'])
                
                inventario_inicial[codigo] = {'produto': produto, 'quantidade': inicial}
                inventario_final[codigo] = {'produto': produto, 'quantidade': final}
            
            print(f"   ✅ {len(inventario_inicial)} produtos carregados do CSV")
            
        except Exception as e:
            print(f"   ❌ Erro ao ler CSV: {e}")
            return
    else:
        # Usar PDFs
        inventario_inicial = ler_pdf_inventario(pdfs[0])
        inventario_final = ler_pdf_inventario(pdfs[1])
        
        if not inventario_inicial and not inventario_final:
            print("❌ ERRO: Não foi possível ler os PDFs de inventário")
            return
    
    # ===================================
    # PASSO 2: Ler transações fiscais
    # ===================================
    print("\n🔄 PASSO 2: Lendo transações fiscais...")
    
    todas_transacoes = {}
    for planilha in planilhas:
        # Pular arquivo de inventário se for CSV
        if planilha == inventario_csv:
            continue
            
        transacoes_planilha = ler_planilha_fiscal(planilha)
        
        # Combinar transações de múltiplas planilhas
        for codigo, dados in transacoes_planilha.items():
            if codigo not in todas_transacoes:
                todas_transacoes[codigo] = dados
            else:
                # Somar quantidades se produto já existe
                todas_transacoes[codigo]['entradas'] += dados['entradas']
                todas_transacoes[codigo]['saidas'] += dados['saidas']
                todas_transacoes[codigo]['cfops'].extend(dados['cfops'])
    
    if not todas_transacoes:
        print("❌ ERRO: Não foi possível ler as planilhas fiscais")
        return
    
    # ===================================
    # PASSO 3: Calcular discrepâncias
    # ===================================
    print("\n🔄 PASSO 3: Calculando discrepâncias...")
    
    resultados = calcular_estoque_esperado(inventario_inicial, inventario_final, todas_transacoes)
    
    # ===================================
    # PASSO 4: Salvar no Supabase
    # ===================================
    print("\n🔄 PASSO 4: Salvando no Supabase...")
    
    salvar_no_supabase(resultados)
    
    # ===================================
    # PASSO 5: Relatório final
    # ===================================
    print("\n📋 RELATÓRIO FINAL:")
    print("=" * 50)
    
    erros = [r for r in resultados if r['status'] == 'ERRO']
    if erros:
        print("❌ PRODUTOS COM DISCREPÂNCIA:")
        for erro in erros[:5]:  # Mostrar apenas os primeiros 5
            print(f"   • {erro['produto']} (Cód: {erro['codigo']})")
            print(f"     Esperado: {erro['estoque_esperado']} | Real: {erro['estoque_real']} | Diff: {erro['diferenca']}")
        
        if len(erros) > 5:
            print(f"   ... e mais {len(erros) - 5} produtos com erro")
    else:
        print("✅ Nenhuma discrepância encontrada!")
    
    print(f"\n🎉 PROCESSAMENTO CONCLUÍDO!")
    print(f"   📊 Resultados salvos no Supabase na tabela 'analise_discrepancia'")
    print(f"   🔍 Total analisado: {len(resultados)} produtos")

# =========================================
# 8️⃣ EXECUÇÃO
# =========================================

if __name__ == "__main__":
    main() 