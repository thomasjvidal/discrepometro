# -*- coding: utf-8 -*-
"""
CORE - Módulo principal do sistema
=================================

Este módulo contém as funções principais:
- Cálculo de discrepâncias
- Funções utilitárias
"""

from .discrepancia import calcular_discrepancias, gerar_relatorio_discrepancias
from .utils import validar_arquivos, criar_diretorio_resultados

__all__ = [
    'calcular_discrepancias',
    'gerar_relatorio_discrepancias',
    'validar_arquivos',
    'criar_diretorio_resultados'
] 