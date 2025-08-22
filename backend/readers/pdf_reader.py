#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF READER - Módulo para leitura de PDFs de inventário
=====================================================

Responsável por:
- Ler PDFs de inventário
- Extrair ano de referência
- Buscar produtos específicos
- Extrair quantidades de estoque
"""

import pdfplumber
import re
from typing import Dict, List, Optional, Tuple
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extrair_ano_do_pdf(caminho_pdf: str) -> int:
    """
    Extrai o ano de referência do PDF de inventário.
    
    Args:
        caminho_pdf: Caminho para o arquivo PDF
        
    Returns:
        Ano encontrado no PDF
    """
    logger.info(f"🔍 Extraindo ano do PDF: {caminho_pdf}")
    
    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            # Ler primeira página
            primeira_pagina = pdf.pages[0]
            texto = primeira_pagina.extract_text()
            
            if not texto:
                logger.warning("⚠️ Primeira página vazia, tentando próxima...")
                if len(pdf.pages) > 1:
                    segunda_pagina = pdf.pages[1]
                    texto = segunda_pagina.extract_text()
            
            if not texto:
                logger.warning("⚠️ Nenhum texto encontrado, usando ano atual")
                return 2024
            
            # Padrões para encontrar ano
            padroes_ano = [
                r'invent[aá]rio\s+(\d{4})',
                r'estoque\s+(\d{4})',
                r'balan[cç]o\s+(\d{4})',
                r'(\d{4})\s*-\s*invent[aá]rio',
                r'ano\s+(\d{4})',
                r'exerc[ií]cio\s+(\d{4})',
                r'(\d{4})\s*-\s*estoque',
                r'fechamento\s+(\d{4})'
            ]
            
            for padrao in padroes_ano:
                match = re.search(padrao, texto, re.IGNORECASE)
                if match:
                    ano = int(match.group(1))
                    logger.info(f"✅ Ano encontrado: {ano}")
                    return ano
            
            # Fallback: procurar por ano no formato YYYY
            ano_match = re.search(r'\b(20[12]\d)\b', texto)
            if ano_match:
                ano = int(ano_match.group(1))
                logger.info(f"✅ Ano encontrado (fallback): {ano}")
                return ano
            
            logger.warning("⚠️ Ano não encontrado, usando ano atual")
            return 2024
            
    except Exception as e:
        logger.error(f"❌ Erro ao extrair ano: {str(e)}")
        return 2024


def normalizar_texto(texto: str) -> str:
    """
    Normaliza texto para busca (remove acentos, converte para minúsculas).
    
    Args:
        texto: Texto original
        
    Returns:
        Texto normalizado
    """
    # Converter para minúsculas
    texto = texto.lower()
    
    # Remover acentos (simplificado)
    texto = texto.replace('á', 'a').replace('à', 'a').replace('ã', 'a').replace('â', 'a')
    texto = texto.replace('é', 'e').replace('è', 'e').replace('ê', 'e')
    texto = texto.replace('í', 'i').replace('ì', 'i').replace('î', 'i')
    texto = texto.replace('ó', 'o').replace('ò', 'o').replace('õ', 'o').replace('ô', 'o')
    texto = texto.replace('ú', 'u').replace('ù', 'u').replace('û', 'u')
    texto = texto.replace('ç', 'c')
    
    return texto


def extrair_dados_produto_da_linha(linha: str) -> Optional[Tuple[str, float, str]]:
    """
    Extrai dados do produto de uma linha do PDF.
    
    Args:
        linha: Linha de texto do PDF
        
    Returns:
        Tupla (descricao, quantidade, unidade) ou None se não encontrou
    """
    linha = linha.strip()
    
    # Padrões para extrair dados do produto
    padroes = [
        # Padrão: CÓDIGO DESCRIÇÃO QUANTIDADE UNIDADE
        r'^(\d+)\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\s]+)\s+([\d,\.]+)\s+([A-Z]{2,})$',
        # Padrão: DESCRIÇÃO CÓDIGO QUANTIDADE UNIDADE
        r'^([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\s]+)\s+(\d+)\s+([\d,\.]+)\s+([A-Z]{2,})$',
        # Padrão: DESCRIÇÃO QUANTIDADE UNIDADE
        r'^([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\s]+)\s+([\d,\.]+)\s+([A-Z]{2,})$',
        # Padrão: CÓDIGO DESCRIÇÃO QUANTIDADE
        r'^(\d+)\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\s]+)\s+([\d,\.]+)$',
        # Padrão: DESCRIÇÃO QUANTIDADE
        r'^([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\s]+)\s+([\d,\.]+)$'
    ]
    
    for padrao in padroes:
        match = re.match(padrao, linha, re.IGNORECASE)
        if match:
            grupos = match.groups()
            
            if len(grupos) == 4:
                # Padrão completo: CÓDIGO DESCRIÇÃO QUANTIDADE UNIDADE
                codigo, descricao, quantidade, unidade = grupos
            elif len(grupos) == 4:
                # Padrão: DESCRIÇÃO CÓDIGO QUANTIDADE UNIDADE
                descricao, codigo, quantidade, unidade = grupos
            elif len(grupos) == 3:
                # Padrão: DESCRIÇÃO QUANTIDADE UNIDADE ou CÓDIGO DESCRIÇÃO QUANTIDADE
                if grupos[0].isdigit():
                    codigo, descricao, quantidade = grupos
                    unidade = 'UN'
                else:
                    descricao, quantidade, unidade = grupos
            elif len(grupos) == 2:
                # Padrão: DESCRIÇÃO QUANTIDADE
                descricao, quantidade = grupos
                unidade = 'UN'
            else:
                continue
            
            # Normalizar dados
            descricao = descricao.strip()
            quantidade = float(quantidade.replace(',', '.'))
            unidade = unidade.strip()
            
            if descricao and quantidade > 0:
                return descricao, quantidade, unidade
    
    return None


def buscar_produto_no_pdf(caminho_pdf: str, produto_busca: str) -> Optional[float]:
    """
    Busca um produto específico no PDF e retorna sua quantidade em estoque.
    
    Args:
        caminho_pdf: Caminho para o arquivo PDF
        produto_busca: Nome/código do produto a buscar
        
    Returns:
        Quantidade em estoque ou None se não encontrou
    """
    logger.info(f"🔍 Buscando produto '{produto_busca}' no PDF: {caminho_pdf}")
    
    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            produto_normalizado = normalizar_texto(produto_busca)
            
            for pagina_num, pagina in enumerate(pdf.pages, 1):
                logger.debug(f"  📄 Processando página {pagina_num}")
                
                texto = pagina.extract_text()
                if not texto:
                    continue
                
                # Dividir em linhas
                linhas = texto.split('\n')
                
                for linha in linhas:
                    linha_normalizada = normalizar_texto(linha)
                    
                    # Verificar se a linha contém o produto
                    if (produto_normalizado in linha_normalizada or 
                        linha_normalizada.startswith(produto_normalizado[:20])):
                        
                        logger.info(f"✅ Produto encontrado na linha: '{linha}'")
                        
                        # Extrair dados da linha
                        dados = extrair_dados_produto_da_linha(linha)
                        if dados:
                            descricao, quantidade, unidade = dados
                            logger.info(f"   📊 Quantidade: {quantidade} {unidade}")
                            return quantidade
            
            logger.warning(f"⚠️ Produto '{produto_busca}' não encontrado no PDF")
            return None
            
    except Exception as e:
        logger.error(f"❌ Erro ao buscar produto: {str(e)}")
        return None


def extrair_estoque_por_produto(caminho_pdf: str, produto: str) -> float:
    """
    Função principal para extrair estoque de um produto específico.
    
    Args:
        caminho_pdf: Caminho para o arquivo PDF
        produto: Nome/código do produto
        
    Returns:
        Quantidade em estoque (0 se não encontrou)
    """
    quantidade = buscar_produto_no_pdf(caminho_pdf, produto)
    return quantidade if quantidade is not None else 0.0


def listar_produtos_pdf(caminho_pdf: str, max_produtos: int = 50) -> List[Dict[str, any]]:
    """
    Lista todos os produtos encontrados no PDF (para debug).
    
    Args:
        caminho_pdf: Caminho para o arquivo PDF
        max_produtos: Número máximo de produtos a listar
        
    Returns:
        Lista de produtos encontrados
    """
    logger.info(f"📋 Listando produtos do PDF: {caminho_pdf}")
    
    produtos_encontrados = []
    
    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            for pagina_num, pagina in enumerate(pdf.pages, 1):
                texto = pagina.extract_text()
                if not texto:
                    continue
                
                linhas = texto.split('\n')
                
                for linha in linhas:
                    dados = extrair_dados_produto_da_linha(linha)
                    if dados:
                        descricao, quantidade, unidade = dados
                        produtos_encontrados.append({
                            'descricao': descricao,
                            'quantidade': quantidade,
                            'unidade': unidade,
                            'pagina': pagina_num
                        })
                        
                        if len(produtos_encontrados) >= max_produtos:
                            break
                
                if len(produtos_encontrados) >= max_produtos:
                    break
        
        logger.info(f"✅ Encontrados {len(produtos_encontrados)} produtos")
        return produtos_encontrados
        
    except Exception as e:
        logger.error(f"❌ Erro ao listar produtos: {str(e)}")
        return []


if __name__ == "__main__":
    # Teste do módulo
    print("🧪 Testando módulo pdf_reader...")
    
    # Exemplo de uso
    try:
        # Testar extração de ano
        ano = extrair_ano_do_pdf("Inventário 2023.pdf")
        print(f"✅ Ano extraído: {ano}")
        
        # Testar busca de produto
        estoque = extrair_estoque_por_produto("Inventário 2023.pdf", "PRODUTO_1")
        print(f"✅ Estoque encontrado: {estoque}")
        
    except Exception as e:
        print(f"❌ Erro no teste: {str(e)}") 