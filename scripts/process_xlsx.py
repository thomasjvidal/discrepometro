#!/usr/bin/env python3
"""
Módulo para processamento de planilhas de movimentação fiscal
Usa Polars para processamento otimizado de arquivos grandes
"""

import logging
import polars as pl
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd

logger = logging.getLogger(__name__)

# CFOPs de venda válidos
CFOPS_VENDA = ['5101', '5102', '6101', '6102', '5405', '6405']

def detectar_colunas_movimentacao(df: pl.DataFrame) -> Dict[str, str]:
    """
    Detecta automaticamente as colunas relevantes na planilha
    """
    colunas = {}
    colunas_lower = [col.lower() for col in df.columns]
    
    # Mapeamento de possíveis nomes de colunas
    mapeamento = {
        'produto': ['produto', 'descricao', 'descrição', 'nome_produto', 'item'],
        'codigo': ['codigo', 'código', 'sku', 'cod_produto', 'produto_cod'],
        'quantidade': ['quantidade', 'qtd', 'qtde', 'qty'],
        'valor_total': ['valor_total', 'valor', 'vl_total', 'total', 'preco_total'],
        'cfop': ['cfop', 'cfop_operacao'],
        'data': ['data', 'data_emissao', 'data_operacao', 'dt_emissao']
    }
    
    for coluna_padrao, possiveis_nomes in mapeamento.items():
        for nome in possiveis_nomes:
            if nome in colunas_lower:
                idx = colunas_lower.index(nome)
                colunas[coluna_padrao] = df.columns[idx]
                break
        else:
            # Se não encontrou, usar a primeira coluna que contém a palavra
            for col in df.columns:
                if any(palavra in col.lower() for palavra in possiveis_nomes):
                    colunas[coluna_padrao] = col
                    break
    
    logger.info(f"🔍 Colunas detectadas: {colunas}")
    return colunas

def limpar_dados_movimentacao(df: pl.DataFrame, colunas: Dict[str, str]) -> pl.DataFrame:
    """
    Limpa e padroniza os dados de movimentação
    """
    logger.info("🧹 Limpando dados de movimentação...")
    
    # Selecionar apenas colunas necessárias
    colunas_necessarias = [colunas.get('produto'), colunas.get('codigo'), 
                          colunas.get('quantidade'), colunas.get('valor_total'), 
                          colunas.get('cfop')]
    colunas_necessarias = [col for col in colunas_necessarias if col]
    
    df_limpo = df.select(colunas_necessarias)
    
    # Renomear colunas para padrão
    mapeamento_renomear = {}
    for col in df_limpo.columns:
        if col == colunas.get('produto'):
            mapeamento_renomear[col] = 'produto'
        elif col == colunas.get('codigo'):
            mapeamento_renomear[col] = 'codigo'
        elif col == colunas.get('quantidade'):
            mapeamento_renomear[col] = 'quantidade'
        elif col == colunas.get('valor_total'):
            mapeamento_renomear[col] = 'valor_total'
        elif col == colunas.get('cfop'):
            mapeamento_renomear[col] = 'cfop'
    
    df_limpo = df_limpo.rename(mapeamento_renomear)
    
    # Converter tipos de dados
    df_limpo = df_limpo.with_columns([
        pl.col('quantidade').cast(pl.Float64),
        pl.col('valor_total').cast(pl.Float64),
        pl.col('cfop').cast(pl.Utf8),
        pl.col('produto').cast(pl.Utf8),
        pl.col('codigo').cast(pl.Utf8)
    ])
    
    # Remover linhas com dados inválidos
    df_limpo = df_limpo.filter(
        (pl.col('quantidade').is_not_null()) &
        (pl.col('quantidade') > 0) &
        (pl.col('cfop').is_not_null()) &
        (pl.col('produto').is_not_null())
    )
    
    logger.info(f"✅ Dados limpos: {len(df_limpo)} registros válidos")
    return df_limpo

def filtrar_cfops_venda(df: pl.DataFrame) -> pl.DataFrame:
    """
    Filtra apenas registros com CFOPs de venda
    """
    logger.info(f"🔍 Filtrando CFOPs de venda: {CFOPS_VENDA}")
    
    df_vendas = df.filter(pl.col('cfop').is_in(CFOPS_VENDA))
    
    logger.info(f"📊 Registros de venda encontrados: {len(df_vendas)}")
    return df_vendas

def processar_planilhas_movimentacao(arquivo: Path, cfops_venda: List[str], tipo: str = 'emitente') -> pd.DataFrame:
    """
    Processa planilha de movimentação e retorna DataFrame com vendas
    """
    logger.info(f"📊 Processando {tipo}: {arquivo.name}")
    
    try:
        # Detectar extensão do arquivo
        extensao = arquivo.suffix.lower()
        
        if extensao == '.csv':
            # Usar Polars para CSV (mais rápido para arquivos grandes)
            df = pl.read_csv(arquivo, try_parse_dates=True)
        elif extensao in ['.xlsx', '.xls']:
            # Para Excel, usar pandas primeiro e converter para Polars
            df_pandas = pd.read_excel(arquivo, engine='openpyxl')
            df = pl.from_pandas(df_pandas)
        else:
            raise ValueError(f"Formato de arquivo não suportado: {extensao}")
        
        logger.info(f"📈 Arquivo carregado: {len(df)} linhas, {len(df.columns)} colunas")
        
        # Detectar colunas automaticamente
        colunas = detectar_colunas_movimentacao(df)
        
        # Validar se encontrou colunas essenciais
        colunas_essenciais = ['produto', 'quantidade', 'cfop']
        colunas_faltantes = [col for col in colunas_essenciais if col not in colunas]
        if colunas_faltantes:
            raise ValueError(f"Colunas não encontradas: {colunas_faltantes}")
        
        # Limpar dados
        df_limpo = limpar_dados_movimentacao(df, colunas)
        
        # Filtrar CFOPs de venda
        df_vendas = filtrar_cfops_venda(df_limpo)
        
        # Converter para pandas para compatibilidade
        df_final = df_vendas.to_pandas()
        
        logger.info(f"✅ {tipo} processado: {len(df_final)} registros de venda")
        return df_final
        
    except Exception as e:
        logger.error(f"❌ Erro ao processar {tipo}: {str(e)}")
        raise

def agrupar_produtos_vendidos(df_emitente: pd.DataFrame, df_destinatario: pd.DataFrame) -> pd.DataFrame:
    """
    Agrupa produtos vendidos de ambas as planilhas
    """
    logger.info("🔄 Agrupando produtos vendidos...")
    
    # Combinar dados
    df_combinado = pd.concat([df_emitente, df_destinatario], ignore_index=True)
    
    # Agrupar por produto
    df_agrupado = df_combinado.groupby(['produto', 'codigo']).agg({
        'quantidade': 'sum',
        'valor_total': 'sum',
        'cfop': lambda x: list(set(x))  # Lista de CFOPs únicos
    }).reset_index()
    
    # Ordenar por quantidade vendida
    df_agrupado = df_agrupado.sort_values('quantidade', ascending=False)
    
    logger.info(f"📊 Total de produtos únicos: {len(df_agrupado)}")
    return df_agrupado

if __name__ == "__main__":
    # Teste do módulo
    import sys
    
    if len(sys.argv) != 2:
        print("Uso: python process_xlsx.py <arquivo_planilha>")
        sys.exit(1)
    
    arquivo = Path(sys.argv[1])
    resultado = processar_planilhas_movimentacao(arquivo, CFOPS_VENDA)
    print(f"Resultado: {len(resultado)} registros processados") 