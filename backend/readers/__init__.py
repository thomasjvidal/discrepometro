# -*- coding: utf-8 -*-
"""
READER - Módulo para leitura de arquivos
=======================================

Este módulo contém funções para leitura de:
- Planilhas Excel (.xlsx, .xlsb)
- PDFs de inventário
"""

from .planilha_reader import get_top10_produtos, validar_planilha
from .pdf_reader import extrair_estoque_por_produto, extrair_ano_do_pdf

__all__ = [
    'get_top10_produtos',
    'validar_planilha', 
    'extrair_estoque_por_produto',
    'extrair_ano_do_pdf'
] 