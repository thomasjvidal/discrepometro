#!/usr/bin/env python3
"""
Módulo para processamento de PDFs de inventário
Usa pdfplumber para extrair tabelas dos PDFs
"""

import logging
import pdfplumber
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any, Optional
import re

logger = logging.getLogger(__name__)

def detectar_ano_inventario(nome_arquivo: str, conteudo_pdf: str) -> int:
    """
    Detecta o ano do inventário baseado no nome do arquivo ou conteúdo
    """
    # Tentar pelo nome do arquivo
    ano_match = re.search(r'20\d{2}', nome_arquivo)
    if ano_match:
        return int(ano_match.group())
    
    # Tentar pelo conteúdo do PDF
    ano_match = re.search(r'20\d{2}', conteudo_pdf)
    if ano_match:
        return int(ano_match.group())
    
    # Padrão: se não encontrar, assumir 2023
    logger.warning("⚠️ Ano não detectado, assumindo 2023")
    return 2023

def extrair_tabelas_pdf(arquivo_pdf: Path) -> List[pd.DataFrame]:
    """
    Extrai todas as tabelas do PDF usando pdfplumber
    """
    logger.info(f"📄 Extraindo tabelas de: {arquivo_pdf.name}")
    
    tabelas = []
    
    try:
        with pdfplumber.open(arquivo_pdf) as pdf:
            logger.info(f"📋 PDF tem {len(pdf.pages)} páginas")
            
            for pagina_num, pagina in enumerate(pdf.pages):
                logger.info(f"📄 Processando página {pagina_num + 1}")
                
                # Extrair tabelas da página
                tabelas_pagina = pagina.extract_tables()
                
                for tabela_idx, tabela in enumerate(tabelas_pagina):
                    if tabela and len(tabela) > 1:  # Tabela válida
                        df = pd.DataFrame(tabela[1:], columns=tabela[0])
                        df['pagina'] = pagina_num + 1
                        df['tabela'] = tabela_idx + 1
                        tabelas.append(df)
                        
                        logger.info(f"  📊 Tabela {tabela_idx + 1}: {len(df)} linhas")
        
        logger.info(f"✅ Total de tabelas extraídas: {len(tabelas)}")
        return tabelas
        
    except Exception as e:
        logger.error(f"❌ Erro ao processar PDF: {str(e)}")
        raise

def detectar_colunas_inventario(df: pd.DataFrame) -> Dict[str, str]:
    """
    Detecta automaticamente as colunas do inventário
    """
    colunas = {}
    colunas_lower = [col.lower() if col else '' for col in df.columns]
    
    # Mapeamento de possíveis nomes de colunas
    mapeamento = {
        'produto': ['produto', 'descricao', 'descrição', 'nome_produto', 'item', 'mercadoria'],
        'codigo': ['codigo', 'código', 'sku', 'cod_produto', 'produto_cod', 'referencia'],
        'quantidade': ['quantidade', 'qtd', 'qtde', 'qty', 'estoque', 'saldo'],
        'valor_unitario': ['valor_unitario', 'preco_unitario', 'vl_unit', 'preco'],
        'valor_total': ['valor_total', 'valor', 'vl_total', 'total', 'preco_total'],
        'unidade': ['unidade', 'un', 'medida']
    }
    
    for coluna_padrao, possiveis_nomes in mapeamento.items():
        for nome in possiveis_nomes:
            for idx, col in enumerate(colunas_lower):
                if nome in col:
                    colunas[coluna_padrao] = df.columns[idx]
                    break
            if coluna_padrao in colunas:
                break
    
    logger.info(f"🔍 Colunas detectadas no inventário: {colunas}")
    return colunas

def limpar_dados_inventario(df: pd.DataFrame, colunas: Dict[str, str]) -> pd.DataFrame:
    """
    Limpa e padroniza os dados do inventário
    """
    logger.info("🧹 Limpando dados do inventário...")
    
    # Selecionar apenas colunas necessárias
    colunas_necessarias = []
    for col_padrao in ['produto', 'codigo', 'quantidade', 'valor_total']:
        if col_padrao in colunas:
            colunas_necessarias.append(colunas[col_padrao])
    
    if not colunas_necessarias:
        logger.warning("⚠️ Nenhuma coluna relevante encontrada")
        return pd.DataFrame()
    
    df_limpo = df[colunas_necessarias].copy()
    
    # Renomear colunas para padrão
    mapeamento_renomear = {}
    for col in df_limpo.columns:
        for col_padrao, col_original in colunas.items():
            if col == col_original:
                mapeamento_renomear[col] = col_padrao
                break
    
    df_limpo = df_limpo.rename(columns=mapeamento_renomear)
    
    # Converter tipos de dados
    if 'quantidade' in df_limpo.columns:
        df_limpo['quantidade'] = pd.to_numeric(df_limpo['quantidade'], errors='coerce')
    
    if 'valor_total' in df_limpo.columns:
        df_limpo['valor_total'] = pd.to_numeric(df_limpo['valor_total'], errors='coerce')
    
    # Remover linhas com dados inválidos
    df_limpo = df_limpo.dropna(subset=['produto'])
    
    # Remover linhas com quantidade zero ou negativa
    if 'quantidade' in df_limpo.columns:
        df_limpo = df_limpo[df_limpo['quantidade'] > 0]
    
    logger.info(f"✅ Dados limpos: {len(df_limpo)} registros válidos")
    return df_limpo

def buscar_produtos_inventario(df_inventario: pd.DataFrame, produtos_busca: pd.DataFrame) -> Dict[str, Dict]:
    """
    Busca produtos específicos no inventário
    """
    logger.info(f"🔍 Buscando {len(produtos_busca)} produtos no inventário...")
    
    resultados = {}
    
    for _, produto in produtos_busca.iterrows():
        nome_produto = produto['produto'].lower()
        codigo_produto = produto['codigo'].lower() if pd.notna(produto['codigo']) else ''
        
        # Buscar por nome do produto
        matches = df_inventario[
            df_inventario['produto'].str.lower().str.contains(nome_produto, na=False)
        ]
        
        # Se não encontrou por nome, tentar por código
        if len(matches) == 0 and codigo_produto:
            matches = df_inventario[
                df_inventario['codigo'].str.lower().str.contains(codigo_produto, na=False)
            ]
        
        if len(matches) > 0:
            # Pegar o primeiro match
            match = matches.iloc[0]
            resultados[produto['produto']] = {
                'produto': match['produto'],
                'codigo': match.get('codigo', ''),
                'quantidade': match.get('quantidade', 0),
                'valor_total': match.get('valor_total', 0),
                'encontrado': True
            }
            logger.info(f"✅ Encontrado: {produto['produto']} - Qtd: {match.get('quantidade', 0)}")
        else:
            resultados[produto['produto']] = {
                'produto': produto['produto'],
                'codigo': produto.get('codigo', ''),
                'quantidade': 0,
                'valor_total': 0,
                'encontrado': False
            }
            logger.warning(f"❌ Não encontrado: {produto['produto']}")
    
    return resultados

def processar_pdfs_inventario(arquivo_pdf: Path, produtos_top10: pd.DataFrame, ano: int) -> Dict[str, Dict]:
    """
    Processa PDF de inventário e extrai dados dos produtos top 10
    """
    logger.info(f"📄 Processando inventário {ano}: {arquivo_pdf.name}")
    
    try:
        # Extrair tabelas do PDF
        tabelas = extrair_tabelas_pdf(arquivo_pdf)
        
        if not tabelas:
            raise ValueError("Nenhuma tabela encontrada no PDF")
        
        # Combinar todas as tabelas
        df_combinado = pd.concat(tabelas, ignore_index=True)
        logger.info(f"📊 Total de registros extraídos: {len(df_combinado)}")
        
        # Detectar colunas
        colunas = detectar_colunas_inventario(df_combinado)
        
        # Limpar dados
        df_limpo = limpar_dados_inventario(df_combinado, colunas)
        
        if len(df_limpo) == 0:
            raise ValueError("Nenhum dado válido encontrado após limpeza")
        
        # Buscar produtos top 10 no inventário
        resultados = buscar_produtos_inventario(df_limpo, produtos_top10)
        
        logger.info(f"✅ Inventário {ano} processado: {len(resultados)} produtos encontrados")
        return resultados
        
    except Exception as e:
        logger.error(f"❌ Erro ao processar inventário {ano}: {str(e)}")
        raise

if __name__ == "__main__":
    # Teste do módulo
    import sys
    
    if len(sys.argv) != 2:
        print("Uso: python process_pdf.py <arquivo_pdf>")
        sys.exit(1)
    
    arquivo = Path(sys.argv[1])
    
    # Criar DataFrame de teste
    produtos_teste = pd.DataFrame({
        'produto': ['Produto Teste 1', 'Produto Teste 2'],
        'codigo': ['TEST001', 'TEST002'],
        'quantidade': [100, 50]
    })
    
    resultado = processar_pdfs_inventario(arquivo, produtos_teste, 2023)
    print(f"Resultado: {len(resultado)} produtos processados") 