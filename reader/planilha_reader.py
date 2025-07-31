#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PLANILHA READER - Módulo para leitura de planilhas CFOP
======================================================

Responsável por:
- Ler planilhas Excel (.xlsx, .xlsb)
- Identificar colunas essenciais (CFOP, Código, Quantidade)
- Filtrar vendas (CFOPs 5xxx, 6xxx, 7xxx)
- Extrair top N produtos mais vendidos
"""

import pandas as pd
import re
from typing import List, Dict, Any, Optional
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def detectar_colunas_essenciais(df: pd.DataFrame) -> Dict[str, str]:
    """
    Detecta automaticamente as colunas essenciais na planilha.
    
    Args:
        df: DataFrame da planilha
        
    Returns:
        Dict com mapeamento das colunas encontradas
    """
    logger.info("🔍 Detectando colunas essenciais...")
    
    colunas_encontradas = {}
    colunas_df = [col.lower().strip() for col in df.columns]
    
    # Padrões para cada coluna essencial
    padroes_cfop = ['cfop', 'codigo fiscal', 'cod fiscal', 'fiscal']
    padroes_codigo = ['codigo', 'código', 'produto', 'mercadoria', 'item', 'id']
    padroes_quantidade = ['quantidade', 'qtde', 'qtd', 'qty', 'amount', 'saidas']
    
    # Buscar CFOP
    for padrao in padroes_cfop:
        for i, col in enumerate(colunas_df):
            if padrao in col:
                colunas_encontradas['cfop'] = df.columns[i]
                logger.info(f"✅ CFOP encontrado: {df.columns[i]}")
                break
        if 'cfop' in colunas_encontradas:
            break
    
    # Buscar Código
    for padrao in padroes_codigo:
        for i, col in enumerate(colunas_df):
            if padrao in col:
                colunas_encontradas['codigo'] = df.columns[i]
                logger.info(f"✅ Código encontrado: {df.columns[i]}")
                break
        if 'codigo' in colunas_encontradas:
            break
    
    # Buscar Quantidade
    for padrao in padroes_quantidade:
        for i, col in enumerate(colunas_df):
            if padrao in col:
                colunas_encontradas['quantidade'] = df.columns[i]
                logger.info(f"✅ Quantidade encontrada: {df.columns[i]}")
                break
        if 'quantidade' in colunas_encontradas:
            break
    
    # Fallback por posição se não encontrou
    if 'cfop' not in colunas_encontradas and len(df.columns) >= 8:
        colunas_encontradas['cfop'] = df.columns[7]  # Geralmente CFOP está na coluna 8
        logger.info(f"🔄 Fallback CFOP: {df.columns[7]}")
    
    if 'codigo' not in colunas_encontradas and len(df.columns) >= 10:
        colunas_encontradas['codigo'] = df.columns[9]  # Geralmente código está na coluna 10
        logger.info(f"🔄 Fallback Código: {df.columns[9]}")
    
    if 'quantidade' not in colunas_encontradas and len(df.columns) >= 12:
        colunas_encontradas['quantidade'] = df.columns[11]  # Geralmente quantidade está na coluna 12
        logger.info(f"🔄 Fallback Quantidade: {df.columns[11]}")
    
    return colunas_encontradas


def filtrar_vendas(df: pd.DataFrame, coluna_cfop: str) -> pd.DataFrame:
    """
    Filtra apenas as linhas de venda (CFOPs 5xxx, 6xxx, 7xxx).
    
    Args:
        df: DataFrame original
        coluna_cfop: Nome da coluna CFOP
        
    Returns:
        DataFrame filtrado apenas com vendas
    """
    logger.info("🛒 Filtrando vendas (CFOPs 5xxx, 6xxx, 7xxx)...")
    
    # Converter CFOP para string e limpar
    df[coluna_cfop] = df[coluna_cfop].astype(str).str.strip()
    
    # Filtrar CFOPs de venda
    mask_vendas = df[coluna_cfop].str.match(r'^[5-7]\d{3}$', na=False)
    df_vendas = df[mask_vendas].copy()
    
    logger.info(f"✅ Vendas encontradas: {len(df_vendas)} linhas")
    
    return df_vendas


def get_top10_produtos(caminho_planilha: str, max_produtos: int = 10) -> List[Dict[str, Any]]:
    """
    Extrai os N produtos mais vendidos da planilha.
    
    Args:
        caminho_planilha: Caminho para o arquivo da planilha
        max_produtos: Número máximo de produtos a retornar
        
    Returns:
        Lista de dicionários com informações dos produtos
    """
    logger.info(f"📊 Lendo planilha: {caminho_planilha}")
    
    try:
        # Detectar tipo de arquivo e ler
        if caminho_planilha.endswith('.xlsb'):
            df = pd.read_excel(caminho_planilha, engine='pyxlsb')
        else:
            df = pd.read_excel(caminho_planilha)
        
        logger.info(f"✅ Planilha carregada: {len(df)} linhas, {len(df.columns)} colunas")
        logger.info(f"📋 Colunas: {list(df.columns)}")
        
        # Detectar colunas essenciais
        colunas = detectar_colunas_essenciais(df)
        
        # Validar se encontrou todas as colunas
        colunas_faltando = [col for col in ['cfop', 'codigo', 'quantidade'] if col not in colunas]
        if colunas_faltando:
            raise ValueError(f"Colunas essenciais não encontradas: {colunas_faltando}")
        
        # Filtrar vendas
        df_vendas = filtrar_vendas(df, colunas['cfop'])
        
        if len(df_vendas) == 0:
            raise ValueError("Nenhuma venda encontrada na planilha")
        
        # Agrupar por produto e somar quantidades
        vendas_por_produto = df_vendas.groupby(colunas['codigo']).agg({
            colunas['quantidade']: 'sum',
            colunas['cfop']: 'first'  # Pegar o primeiro CFOP do produto
        }).reset_index()
        
        # Renomear colunas para facilitar
        vendas_por_produto.columns = ['codigo', 'vendas', 'cfop']
        
        # Ordenar por vendas e pegar top N
        top_produtos = vendas_por_produto.nlargest(max_produtos, 'vendas')
        
        # Converter para formato de retorno
        resultado = []
        for _, row in top_produtos.iterrows():
            produto = {
                'codigo': str(row['codigo']),
                'descricao': f"PRODUTO_{row['codigo']}",  # Descrição genérica
                'vendas': float(row['vendas']),
                'cfop': str(row['cfop'])
            }
            resultado.append(produto)
        
        # Log dos produtos encontrados
        logger.info(f"🏆 TOP {len(resultado)} PRODUTOS MAIS VENDIDOS:")
        for i, produto in enumerate(resultado, 1):
            logger.info(f"   {i}. {produto['codigo']}: {produto['vendas']} unidades (CFOP: {produto['cfop']})")
        
        return resultado
        
    except Exception as e:
        logger.error(f"❌ Erro ao ler planilha: {str(e)}")
        raise


def validar_planilha(caminho_planilha: str) -> bool:
    """
    Valida se a planilha pode ser lida e tem as colunas necessárias.
    
    Args:
        caminho_planilha: Caminho para o arquivo
        
    Returns:
        True se válida, False caso contrário
    """
    try:
        # Tentar ler a planilha
        if caminho_planilha.endswith('.xlsb'):
            df = pd.read_excel(caminho_planilha, engine='pyxlsb')
        else:
            df = pd.read_excel(caminho_planilha)
        
        # Detectar colunas
        colunas = detectar_colunas_essenciais(df)
        
        # Verificar se tem todas as colunas essenciais
        return all(col in colunas for col in ['cfop', 'codigo', 'quantidade'])
        
    except Exception as e:
        logger.error(f"❌ Planilha inválida: {str(e)}")
        return False


if __name__ == "__main__":
    # Teste do módulo
    print("🧪 Testando módulo planilha_reader...")
    
    # Exemplo de uso
    try:
        produtos = get_top10_produtos("NFe_Emitente_Itens.xlsx", max_produtos=5)
        print(f"✅ Teste concluído: {len(produtos)} produtos encontrados")
    except Exception as e:
        print(f"❌ Erro no teste: {str(e)}") 