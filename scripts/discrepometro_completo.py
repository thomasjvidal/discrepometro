#!/usr/bin/env python3
"""
Discrepômetro - Radar Fiscal Inteligente
Sistema para detectar discrepâncias entre inventário declarado e movimentações fiscais
"""

import sys
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd
import polars as pl
from datetime import datetime

# Importar módulos locais
from process_xlsx import processar_planilhas_movimentacao
from process_pdf import processar_pdfs_inventario
from discrepancy_calculator import calcular_discrepancias_top10

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('discrepometro.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class Discrepometro:
    """
    Sistema principal do Discrepômetro para análise fiscal
    """
    
    def __init__(self):
        self.cfops_venda = ['5101', '5102', '6101', '6102', '5405', '6405']
        self.resultados = []
        
    def identificar_arquivos(self, diretorio: str) -> Dict[str, Path]:
        """
        Identifica automaticamente os 4 arquivos necessários
        """
        logger.info("🔍 Identificando arquivos de entrada...")
        
        diretorio_path = Path(diretorio)
        arquivos = {
            'inventario_2023': None,
            'inventario_2024': None,
            'emitente_2023': None,
            'destinatario_2023': None
        }
        
        # Buscar PDFs de inventário
        pdfs = list(diretorio_path.glob("*.pdf"))
        for pdf in pdfs:
            nome_lower = pdf.name.lower()
            if '2023' in nome_lower or 'inventario' in nome_lower:
                if '2024' not in nome_lower:
                    arquivos['inventario_2023'] = pdf
                    logger.info(f"📄 Inventário 2023: {pdf.name}")
            elif '2024' in nome_lower:
                arquivos['inventario_2024'] = pdf
                logger.info(f"📄 Inventário 2024: {pdf.name}")
        
        # Buscar planilhas de movimentação
        planilhas = list(diretorio_path.glob("*.csv")) + list(diretorio_path.glob("*.xlsx"))
        for planilha in planilhas:
            nome_lower = planilha.name.lower()
            if 'emitente' in nome_lower:
                arquivos['emitente_2023'] = planilha
                logger.info(f"📊 Emitente 2023: {planilha.name}")
            elif 'destinatario' in nome_lower:
                arquivos['destinatario_2023'] = planilha
                logger.info(f"📊 Destinatário 2023: {planilha.name}")
        
        # Validar se todos os arquivos foram encontrados
        arquivos_faltantes = [k for k, v in arquivos.items() if v is None]
        if arquivos_faltantes:
            raise FileNotFoundError(f"Arquivos não encontrados: {arquivos_faltantes}")
        
        logger.info("✅ Todos os arquivos identificados com sucesso!")
        return arquivos
    
    def processar_movimentacoes(self, arquivos: Dict[str, Path]) -> pd.DataFrame:
        """
        Etapa 1: Processa planilhas de movimentação e identifica top 10 produtos mais vendidos
        """
        logger.info("📊 ETAPA 1: Processando movimentações fiscais...")
        
        # Processar planilha emitente
        logger.info("📈 Processando planilha emitente...")
        df_emitente = processar_planilhas_movimentacao(
            arquivos['emitente_2023'],
            self.cfops_venda,
            tipo='emitente'
        )
        
        # Processar planilha destinatário
        logger.info("📉 Processando planilha destinatário...")
        df_destinatario = processar_planilhas_movimentacao(
            arquivos['destinatario_2023'],
            self.cfops_venda,
            tipo='destinatario'
        )
        
        # Unificar dados
        logger.info("🔄 Unificando dados de movimentação...")
        df_unificado = pd.concat([df_emitente, df_destinatario], ignore_index=True)
        
        # Agrupar por produto e somar quantidades
        df_agrupado = df_unificado.groupby(['produto', 'codigo']).agg({
            'quantidade': 'sum',
            'valor_total': 'sum',
            'cfop': lambda x: list(set(x))  # Lista de CFOPs únicos
        }).reset_index()
        
        # Ordenar por quantidade vendida e pegar top 10
        df_top10 = df_agrupado.nlargest(10, 'quantidade')
        
        logger.info(f"🏆 Top 10 produtos mais vendidos identificados:")
        for idx, row in df_top10.iterrows():
            logger.info(f"  {idx+1}. {row['produto']} - {row['quantidade']} unidades")
        
        return df_top10
    
    def processar_inventarios(self, arquivos: Dict[str, Path], produtos_top10: pd.DataFrame) -> Dict[str, Dict]:
        """
        Etapa 2: Processa PDFs de inventário e extrai dados dos produtos top 10
        """
        logger.info("📄 ETAPA 2: Processando inventários...")
        
        inventarios = {}
        
        # Processar inventário 2023
        logger.info("📋 Processando inventário 2023...")
        inventario_2023 = processar_pdfs_inventario(
            arquivos['inventario_2023'],
            produtos_top10,
            ano=2023
        )
        inventarios['2023'] = inventario_2023
        
        # Processar inventário 2024
        logger.info("📋 Processando inventário 2024...")
        inventario_2024 = processar_pdfs_inventario(
            arquivos['inventario_2024'],
            produtos_top10,
            ano=2024
        )
        inventarios['2024'] = inventario_2024
        
        return inventarios
    
    def calcular_discrepancias(self, produtos_top10: pd.DataFrame, inventarios: Dict[str, Dict]) -> List[Dict]:
        """
        Etapa 3: Calcula discrepâncias entre vendas e inventários
        """
        logger.info("🔍 ETAPA 3: Calculando discrepâncias...")
        
        return calcular_discrepancias_top10(produtos_top10, inventarios)
    
    def gerar_relatorio(self, discrepancias: List[Dict]) -> Dict[str, Any]:
        """
        Gera relatório final com estatísticas
        """
        logger.info("📊 Gerando relatório final...")
        
        total_produtos = len(discrepancias)
        criticos = len([d for d in discrepancias if d['status'] == 'CRÍTICO'])
        alertas = len([d for d in discrepancias if d['status'] == 'ALERTA'])
        ok = len([d for d in discrepancias if d['status'] == 'OK'])
        
        relatorio = {
            'timestamp': datetime.now().isoformat(),
            'estatisticas': {
                'total_produtos': total_produtos,
                'criticos': criticos,
                'alertas': alertas,
                'ok': ok,
                'percentual_critico': round((criticos / total_produtos) * 100, 2) if total_produtos > 0 else 0
            },
            'discrepancias': discrepancias
        }
        
        logger.info(f"📈 Estatísticas do relatório:")
        logger.info(f"  - Total de produtos: {total_produtos}")
        logger.info(f"  - Críticos: {criticos}")
        logger.info(f"  - Alertas: {alertas}")
        logger.info(f"  - OK: {ok}")
        
        return relatorio
    
    def executar_analise(self, diretorio: str) -> Dict[str, Any]:
        """
        Executa análise completa do Discrepômetro
        """
        logger.info("🚀 INICIANDO ANÁLISE DO DISCREPÔMETRO")
        logger.info("=" * 50)
        
        try:
            # Etapa 0: Identificar arquivos
            arquivos = self.identificar_arquivos(diretorio)
            
            # Etapa 1: Processar movimentações
            produtos_top10 = self.processar_movimentacoes(arquivos)
            
            # Etapa 2: Processar inventários
            inventarios = self.processar_inventarios(arquivos, produtos_top10)
            
            # Etapa 3: Calcular discrepâncias
            discrepancias = self.calcular_discrepancias(produtos_top10, inventarios)
            
            # Etapa 4: Gerar relatório
            relatorio = self.gerar_relatorio(discrepancias)
            
            logger.info("✅ ANÁLISE CONCLUÍDA COM SUCESSO!")
            logger.info("=" * 50)
            
            return relatorio
            
        except Exception as e:
            logger.error(f"❌ Erro na análise: {str(e)}")
            raise

def main():
    """
    Função principal para execução via CLI
    """
    if len(sys.argv) != 2:
        print("Uso: python discrepometro_completo.py <diretorio_arquivos>")
        sys.exit(1)
    
    diretorio = sys.argv[1]
    
    try:
        discrepometro = Discrepometro()
        resultado = discrepometro.executar_analise(diretorio)
        
        # Salvar resultado em JSON
        output_file = Path(diretorio) / "relatorio_discrepometro.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(resultado, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Relatório salvo em: {output_file}")
        print(f"📊 Total de produtos analisados: {resultado['estatisticas']['total_produtos']}")
        print(f"🚨 Produtos críticos: {resultado['estatisticas']['criticos']}")
        print(f"⚠️  Produtos em alerta: {resultado['estatisticas']['alertas']}")
        
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 