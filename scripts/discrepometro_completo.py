import os
import re
import glob
import pandas as pd
import pdfplumber
from supabase import create_client
import json
import sys

# 1) Configurar variáveis de ambiente se não existirem
if not os.getenv("SUPABASE_URL"):
    os.environ['SUPABASE_URL'] = 'https://hvjjcegcdivumprqviug.supabase.co'
    os.environ['SUPABASE_ANON_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4'

# 2) Inicializa Supabase
URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_ANON_KEY") 
sb = create_client(URL, KEY)

# 3) Nome da tabela de discrepâncias
TBL_DISP = "analise_discrepancia"

def processar_pdf_robusto(path, inv):
    """Processa PDF com múltiplos padrões para maior compatibilidade"""
    padroes = [
        r"(\d+)\s*-\s*([A-Z0-9 ]+)\s*-\s*(\d+)",  # Padrão original
        r"Código:\s*(\d+).*?Produto:\s*(.+?).*?Qtd:\s*(\d+)",  # Formato verbose
        r"(\d+)\s*\|\s*(.+?)\s*\|\s*(\d+)",  # Pipe separado
        r"(\d+);(.+?);(\d+)",  # Ponto e vírgula
        r"Item:\s*(\d+)\s*Desc:\s*(.+?)\s*Estoque:\s*(\d+)",  # Formato descritivo
        r"(\d+)\s+([A-Z0-9 ]{5,})\s+(\d+)$",  # Formato tabular
    ]
    
    produtos_encontrados = 0
    
    try:
        with pdfplumber.open(path) as pdf:
            for pagina_num, p in enumerate(pdf.pages):
                txt = p.extract_text() or ""
                
                # Tentar cada padrão
                for i, padrao in enumerate(padroes):
                    matches = list(re.finditer(padrao, txt, re.MULTILINE))
                    if matches:
                        print(f"📄 PDF {path} - Página {pagina_num+1}: Padrão {i+1} encontrou {len(matches)} itens")
                        
                        for m in matches:
                            codigo = m.group(1)
                            produto = m.group(2).strip() if len(m.groups()) >= 2 else f"PRODUTO_{codigo}"
                            quantidade = int(m.group(3))
                            
                            inv[codigo] = {
                                'produto': produto,
                                'quantidade': quantidade,
                                'fonte': f"PDF_{os.path.basename(path)}"
                            }
                            produtos_encontrados += 1
                        
                        break  # Usar apenas o primeiro padrão que funcionar
    except Exception as e:
        print(f"⚠️ Erro ao processar PDF {path}: {e}")
    
    print(f"✅ PDF {path}: {produtos_encontrados} produtos extraídos")
    return produtos_encontrados

def detectar_colunas_excel(df):
    """Detecta automaticamente as colunas necessárias com busca mais robusta"""
    colunas = {}
    
    print(f"🔍 Detectando colunas em {len(df.columns)} colunas disponíveis")
    
    for col in df.columns:
        col_str = str(col).lower().strip()
        col_clean = col_str.replace('_', ' ').replace('-', ' ')
        
        # Debug: mostrar todas as colunas
        print(f"   📋 Analisando coluna: '{col}' -> '{col_clean}'")
        
        # Detecção de código
        if not colunas.get('codigo'):
            if any(termo in col_clean for termo in ['codigo', 'código', 'cod', 'id', 'sku', 'item']):
                colunas['codigo'] = col
                print(f"   ✅ Código encontrado: {col}")
        
        # Detecção de produto/descrição
        if not colunas.get('produto'):
            if any(termo in col_clean for termo in ['produto', 'desc', 'descrição', 'descricao', 'item', 'nome', 'mercadoria']):
                colunas['produto'] = col
                print(f"   ✅ Produto encontrado: {col}")
        
        # Detecção de quantidade
        if not colunas.get('quantidade'):
            if any(termo in col_clean for termo in ['quantidade', 'qtd', 'quant', 'qty', 'estoque']):
                colunas['quantidade'] = col
                print(f"   ✅ Quantidade encontrada: {col}")
        
        # Detecção de tipo/operação
        if not colunas.get('tipo'):
            if any(termo in col_clean for termo in ['tipo', 'operacao', 'operação', 'movim', 'movimento']):
                colunas['tipo'] = col
                print(f"   ✅ Tipo encontrado: {col}")
        
        # Detecção de entradas
        if not colunas.get('entradas'):
            if any(termo in col_clean for termo in ['entrada', 'entradas', 'compra', 'compras', 'input', 'in']):
                colunas['entradas'] = col
                print(f"   ✅ Entradas encontrada: {col}")
        
        # Detecção de saídas
        if not colunas.get('saidas'):
            if any(termo in col_clean for termo in ['saida', 'saidas', 'saída', 'saídas', 'venda', 'vendas', 'output', 'out']):
                colunas['saidas'] = col
                print(f"   ✅ Saídas encontrada: {col}")
        
        # Detecção de estoque inicial
        if not colunas.get('inicial'):
            if any(termo in col_clean for termo in ['inicial', 'inicio', 'início', 'est inicial', 'estoque inicial']):
                colunas['inicial'] = col
                print(f"   ✅ Inicial encontrado: {col}")
        
        # Detecção de estoque final
        if not colunas.get('final'):
            if any(termo in col_clean for termo in ['final', 'fim', 'est final', 'estoque final']):
                colunas['final'] = col
                print(f"   ✅ Final encontrado: {col}")
    
    print(f"🎯 Mapeamento final: {colunas}")
    
    # Se não encontrou código, tentar a primeira coluna como fallback
    if not colunas.get('codigo') and len(df.columns) > 0:
        primeira_col = df.columns[0]
        print(f"⚠️ Usando primeira coluna como código: {primeira_col}")
        colunas['codigo'] = primeira_col
        
    # Se não encontrou produto, tentar a segunda coluna como fallback
    if not colunas.get('produto') and len(df.columns) > 1:
        segunda_col = df.columns[1]
        print(f"⚠️ Usando segunda coluna como produto: {segunda_col}")
        colunas['produto'] = segunda_col
    
    return colunas

def processar_xls_robusto(path, txs):
    """Processa Excel com detecção automática de colunas e tratamento de erros"""
    try:
        print(f"📊 Processando arquivo: {path}")
        
        # Detectar tipo de arquivo e usar engine apropriado
        file_ext = path.lower()
        df = None
        
        if file_ext.endswith(".xlsb"):
            print(f"🔧 Usando pyxlsb para arquivo binário: {path}")
            try:
                df = pd.read_excel(path, engine="pyxlsb")
                print(f"✅ Arquivo .xlsb lido com sucesso")
            except Exception as e:
                print(f"❌ Erro com pyxlsb: {e}")
                # Tentar com openpyxl como fallback
                try:
                    df = pd.read_excel(path, engine="openpyxl")
                    print(f"✅ Fallback com openpyxl funcionou")
                except:
                    raise Exception(f"Não foi possível ler o arquivo .xlsb: {path}")
                    
        elif file_ext.endswith(".csv"):
            # Tentar diferentes encodings para CSV
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            for encoding in encodings:
                try:
                    df = pd.read_csv(path, encoding=encoding)
                    print(f"✅ CSV lido com encoding: {encoding}")
                    break
                except:
                    continue
            if df is None:
                raise Exception(f"Não foi possível ler o CSV com nenhum encoding: {path}")
                
        elif file_ext.endswith((".xlsx", ".xls")):
            # Excel padrão
            engine = "openpyxl" if file_ext.endswith(".xlsx") else "xlrd"
            df = pd.read_excel(path, engine=engine)
            print(f"✅ Excel lido com engine: {engine}")
        else:
            raise Exception(f"Formato não suportado: {path}")
        
        if df is None or df.empty:
            print(f"⚠️ Arquivo vazio ou não lido: {path}")
            return 0
            
        print(f"📊 {path}: {len(df)} linhas, {len(df.columns)} colunas")
        print(f"🔍 Primeiras colunas: {list(df.columns[:5])}")
        
        # Detectar colunas automaticamente
        colunas = detectar_colunas_excel(df)
        
        if not colunas.get('codigo'):
            print(f"❌ Coluna 'código' não encontrada em {path}")
            print(f"📋 Colunas disponíveis: {list(df.columns)}")
            return 0
        
        processados = 0
        
        print(f"📋 Mapeamento de colunas usado:")
        for tipo, col in colunas.items():
            print(f"   • {tipo}: {col}")
        
        for idx, r in df.iterrows():
            try:
                codigo = str(r[colunas['codigo']]).strip()
                
                if not codigo or codigo.lower() in ['nan', 'null', '', 'none']:
                    continue
                    
                # Processar diferentes formatos
                if colunas.get('quantidade'):
                    # Formato simples: código + quantidade + tipo
                    quantidade = float(str(r[colunas['quantidade']]).replace(',', '.'))
                    tipo = str(r.get(colunas.get('tipo', ''), 'ENTRADA')).upper()
                    
                    if codigo not in txs:
                        txs[codigo] = {'entradas': 0, 'saidas': 0, 'produto': ''}
                    
                    if colunas.get('produto'):
                        txs[codigo]['produto'] = str(r[colunas['produto']])
                    
                    if 'ENTRADA' in tipo or 'COMPRA' in tipo:
                        txs[codigo]['entradas'] += quantidade
                    else:
                        txs[codigo]['saidas'] += quantidade
                        
                elif colunas.get('entradas') and colunas.get('saidas'):
                    # Formato completo: entradas e saídas separadas
                    entradas = float(str(r.get(colunas['entradas'], 0)).replace(',', '.')) if pd.notna(r.get(colunas['entradas'], 0)) else 0
                    saidas = float(str(r.get(colunas['saidas'], 0)).replace(',', '.')) if pd.notna(r.get(colunas['saidas'], 0)) else 0
                    
                    if codigo not in txs:
                        txs[codigo] = {'entradas': 0, 'saidas': 0, 'produto': ''}
                    
                    txs[codigo]['entradas'] += entradas
                    txs[codigo]['saidas'] += saidas
                    
                    if colunas.get('produto'):
                        txs[codigo]['produto'] = str(r[colunas['produto']])
                
                processados += 1
                
                # Log dos primeiros 3 registros para debug
                if processados <= 3:
                    print(f"   📝 Registro {processados}: {codigo} - {txs[codigo]}")
                
            except Exception as e:
                print(f"⚠️ Erro na linha {idx}: {e}")
                continue
        
        print(f"✅ {path}: {processados} registros processados com sucesso")
        return processados
        
    except Exception as e:
        print(f"❌ Erro ao processar {path}: {e}")
        import traceback
        print(f"🔍 Detalhes do erro: {traceback.format_exc()}")
        return 0

def calcular_discrepancias(inv, txs):
    """Calcula discrepâncias entre inventário e transações"""
    discrepancias = []
    
    # Processar produtos do inventário
    for codigo, dados_inv in inv.items():
        dados_tx = txs.get(codigo, {'entradas': 0, 'saidas': 0, 'produto': ''})
        
        quantidade_inventario = dados_inv['quantidade']
        saldo_transacoes = dados_tx['entradas'] - dados_tx['saidas']
        diferenca = quantidade_inventario - saldo_transacoes
        
        # Determinar tipo de discrepância (usar valores exatos do banco)
        if abs(diferenca) < 0.01:  # Considerar iguais
            tipo = 'Sem Discrepância'
        elif diferenca > 0:
            tipo = 'Estoque Excedente'
        else:
            tipo = 'Estoque Faltante'
        
        produto_nome = dados_inv.get('produto', '') or dados_tx.get('produto', f'PRODUTO_{codigo}')
        
        discrepancias.append({
            'produto': produto_nome,
            'codigo': codigo,
            'cfop': None,
            'valor_unitario': 0.0,
            'valor_total': 0.0,
            'entradas': int(dados_tx['entradas']),
            'saidas': int(dados_tx['saidas']),
            'est_inicial': 0,
            'est_final': int(saldo_transacoes),
            'est_calculado': int(saldo_transacoes),
            'discrepancia_tipo': tipo,
            'discrepancia_valor': int(abs(diferenca)),
            'observacoes': f"Fonte: {dados_inv.get('fonte', 'PDF')}",
            'ano': 2024,
            'user_id': None
        })
    
    # Processar produtos que só existem nas transações
    for codigo, dados_tx in txs.items():
        if codigo not in inv:
            saldo_transacoes = dados_tx['entradas'] - dados_tx['saidas']
            
            discrepancias.append({
                'produto': dados_tx.get('produto', f'PRODUTO_{codigo}'),
                'codigo': codigo,
                'cfop': None,
                'valor_unitario': 0.0,
                'valor_total': 0.0,
                'entradas': int(dados_tx['entradas']),
                'saidas': int(dados_tx['saidas']),
                'est_inicial': 0,
                'est_final': int(saldo_transacoes),
                'est_calculado': int(saldo_transacoes),
                'discrepancia_tipo': 'Estoque Faltante',  # Mudar para um tipo válido
                'discrepancia_valor': int(abs(saldo_transacoes)),
                'observacoes': 'Produto existe apenas nas transações',
                'ano': 2024,
                'user_id': None
            })
    
    return discrepancias

def exportar_relatorio(disp_list):
    """Exporta relatório para Excel"""
    if not disp_list:
        print("⚠️ Nenhuma discrepância para exportar")
        return
        
    df = pd.DataFrame(disp_list)
    
    try:
        with pd.ExcelWriter("Relatorio_Discrepancias_Completo.xlsx") as writer:
            # Aba geral
            df.to_excel(writer, sheet_name="Resumo_Geral", index=False)
            
            # Aba por tipo
            for tipo in df['discrepancia_tipo'].unique():
                subset = df[df['discrepancia_tipo'] == tipo]
                nome_aba = str(tipo)[:30]
                subset.to_excel(writer, sheet_name=nome_aba, index=False)
        
        print("✅ Relatório Excel gerado: Relatorio_Discrepancias_Completo.xlsx")
    except Exception as e:
        print(f"⚠️ Erro ao gerar relatório: {e}")

def main():
    print("🚀 INICIANDO DISCREPÔMETRO COMPLETO")
    
    inv, txs, disp = {}, {}, []
    
    # Verificar arquivos disponíveis
    pdfs = glob.glob("*.pdf")
    excels = glob.glob("*.xls*") + glob.glob("*.csv")
    
    print(f"📄 Encontrados: {len(pdfs)} PDFs, {len(excels)} planilhas")
    
    if not pdfs and not excels:
        print("❌ Nenhum arquivo PDF ou Excel encontrado no diretório atual")
        return
    
    # Processar todos os PDFs
    total_produtos_pdf = 0
    for pdf in pdfs:
        print(f"📄 Processando PDF: {pdf}")
        produtos = processar_pdf_robusto(pdf, inv)
        total_produtos_pdf += produtos
    
    # Processar todas as planilhas
    total_registros_excel = 0
    for plan in excels:
        print(f"📊 Processando planilha: {plan}")
        registros = processar_xls_robusto(plan, txs)
        total_registros_excel += registros
    
    print(f"\n📋 RESUMO DO PROCESSAMENTO:")
    print(f"   • PDFs: {len(pdfs)} arquivos, {total_produtos_pdf} produtos")
    print(f"   • Excel: {len(excels)} arquivos, {total_registros_excel} registros")
    
    # Calcular discrepâncias
    disp = calcular_discrepancias(inv, txs)
    
    if not disp:
        print("⚠️ Nenhuma discrepância encontrada")
        return
    
    # Estatísticas
    tipos_count = {}
    for d in disp:
        tipo = d['discrepancia_tipo']
        tipos_count[tipo] = tipos_count.get(tipo, 0) + 1
    
    print(f"\n🔍 DISCREPÂNCIAS ENCONTRADAS: {len(disp)}")
    for tipo, count in tipos_count.items():
        print(f"   • {tipo}: {count}")
    
    # Salvar no Supabase
    try:
        # Limpar dados anteriores
        sb.table(TBL_DISP).delete().neq('id', 0).execute()
        print("🗑️ Dados anteriores limpos")
        
        # Inserir novos dados em lotes
        batch_size = 50
        for i in range(0, len(disp), batch_size):
            batch = disp[i:i + batch_size]
            sb.table(TBL_DISP).insert(batch).execute()
            print(f"💾 Lote {i//batch_size + 1}: {len(batch)} registros salvos")
        
        print(f"✅ {len(disp)} discrepâncias salvas no Supabase")
        
    except Exception as e:
        print(f"❌ Erro ao salvar no Supabase: {e}")
    
    # Exportar relatório local
    exportar_relatorio(disp)
    
    print("🎉 PROCESSAMENTO CONCLUÍDO COM SUCESSO!")

if __name__ == "__main__":
    main() 