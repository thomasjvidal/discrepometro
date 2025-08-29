#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DISCREPÔMETRO - ANÁLISE FISCAL INTELIGENTE
==========================================

Arquivo principal que orquestra todo o fluxo:
1. Ler planilhas de CFOPs
2. Encontrar os 10 produtos mais vendidos
3. Ler PDFs de inventário (inicial e final)
4. Calcular discrepâncias
5. Gerar JSON para dashboard

Autor: Sistema Discrepômetro
Data: 2024
"""

import json
import os
import sys
from datetime import datetime
from typing import List, Dict, Any, Optional

# Importar módulos do sistema
from reader.planilha_reader import get_top10_produtos
from reader.pdf_reader import extrair_estoque_por_produto
from core.discrepancia import calcular_discrepancias
from core.utils import validar_arquivos, criar_diretorio_resultados

class DiscrepometroOrchestrator:
    """
    Orquestrador principal do sistema Discrepômetro.
    Coordena todo o fluxo de análise de discrepâncias fiscais.
    """
    
    def __init__(self):
        """Inicializa o orquestrador com configurações padrão."""
        self.config = {
            'caminho_planilha': 'NFe_Emitente_Itens.xlsx',
            'pdf_ano_1': 'Inventário 2023.pdf',
            'pdf_ano_2': 'Inventario 2024.pdf',
            'tolerancia_discrepancia': 1.0,  # Tolerância em unidades
            'max_produtos': 10  # Top N produtos mais vendidos
        }
        self.resultados = []
        self.logs = []
    
    def log(self, mensagem: str, tipo: str = 'INFO'):
        """Registra log com timestamp."""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] {tipo}: {mensagem}"
        self.logs.append(log_entry)
        print(log_entry)
    
    def validar_ambiente(self) -> bool:
        """Valida se todos os arquivos necessários existem."""
        self.log("🔍 Validando ambiente de execução...")
        
        arquivos_necessarios = [
            self.config['caminho_planilha'],
            self.config['pdf_ano_1'],
            self.config['pdf_ano_2']
        ]
        
        for arquivo in arquivos_necessarios:
            if not os.path.exists(arquivo):
                self.log(f"❌ Arquivo não encontrado: {arquivo}", "ERRO")
                return False
            
        self.log("✅ Todos os arquivos necessários encontrados")
        return True
    
    def extrair_top10_produtos(self) -> List[Dict[str, Any]]:
        """Extrai os 10 produtos mais vendidos da planilha."""
        self.log("📊 Extraindo top 10 produtos mais vendidos...")
        
        try:
            produtos_top10 = get_top10_produtos(
                self.config['caminho_planilha'],
                max_produtos=self.config['max_produtos']
            )
            
            self.log(f"✅ Encontrados {len(produtos_top10)} produtos mais vendidos")
            
            # Log dos produtos encontrados
            for i, produto in enumerate(produtos_top10, 1):
                self.log(f"   {i}. {produto['descricao']}: {produto['vendas']} unidades")
            
            return produtos_top10
            
        except Exception as e:
            self.log(f"❌ Erro ao extrair produtos: {str(e)}", "ERRO")
            raise
    
    def processar_inventarios(self, produtos_top10: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Processa inventários para cada produto do top 10."""
        self.log("📄 Processando inventários (PDFs)...")
        
        produtos_processados = []
        
        for i, produto in enumerate(produtos_top10, 1):
            descricao = produto['descricao']
            self.log(f"🔍 Processando produto {i}/{len(produtos_top10)}: {descricao}")
            
            try:
                # Buscar estoque inicial (PDF mais antigo)
                estoque_inicial = extrair_estoque_por_produto(
                    self.config['pdf_ano_1'], 
                    descricao
                )
                
                # Buscar estoque final (PDF mais recente)
                estoque_final = extrair_estoque_por_produto(
                    self.config['pdf_ano_2'], 
                    descricao
                )
                
                # Adicionar dados de estoque ao produto
                produto_processado = {
                    **produto,
                    'estoque_inicial': estoque_inicial,
                    'estoque_final': estoque_final
                }
                
                produtos_processados.append(produto_processado)
                
                self.log(f"   ✅ Estoque inicial: {estoque_inicial}, Final: {estoque_final}")
                
            except Exception as e:
                self.log(f"   ⚠️ Erro ao processar {descricao}: {str(e)}", "WARNING")
                # Continuar com valores padrão
                produto_processado = {
                    **produto,
                    'estoque_inicial': 0,
                    'estoque_final': 0
                }
                produtos_processados.append(produto_processado)
        
        self.log(f"✅ Processamento de inventários concluído: {len(produtos_processados)} produtos")
        return produtos_processados
    
    def calcular_discrepancias(self, produtos_processados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calcula discrepâncias para cada produto."""
        self.log("⚖️ Calculando discrepâncias...")
        
        try:
            resultados = calcular_discrepancias(
                produtos_processados,
                tolerancia=self.config['tolerancia_discrepancia']
            )
            
            # Estatísticas
            produtos_ok = [r for r in resultados if r['status'] == 'OK']
            produtos_erro = [r for r in resultados if r['status'] == 'ERRO']
            
            self.log(f"📊 Resultados: {len(produtos_ok)} OK, {len(produtos_erro)} com ERRO")
            
            if produtos_erro:
                self.log("🚨 Produtos com discrepância:")
                for produto in produtos_erro:
                    self.log(f"   - {produto['produto']}: {produto['discrepancia']} unidades")
            
            return resultados
            
        except Exception as e:
            self.log(f"❌ Erro ao calcular discrepâncias: {str(e)}", "ERRO")
            raise
    
    def gerar_json_final(self, resultados: List[Dict[str, Any]]) -> str:
        """Gera JSON final para o dashboard."""
        self.log("📝 Gerando JSON final...")
        
        # Criar diretório de resultados se não existir
        criar_diretorio_resultados()
        
        # Estrutura completa do resultado
        resultado_completo = {
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'versao': '1.0.0',
                'total_produtos': len(resultados),
                'produtos_ok': len([r for r in resultados if r['status'] == 'OK']),
                'produtos_erro': len([r for r in resultados if r['status'] == 'ERRO']),
                'tolerancia': self.config['tolerancia_discrepancia']
            },
            'configuracao': {
                'planilha': self.config['caminho_planilha'],
                'pdf_inicial': self.config['pdf_ano_1'],
                'pdf_final': self.config['pdf_ano_2']
            },
            'logs': self.logs,
            'resultados': resultados
        }
        
        # Salvar JSON
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        nome_arquivo = f'resultados_discrepometro_{timestamp}.json'
        caminho_arquivo = os.path.join('resultados', nome_arquivo)
        
        with open(caminho_arquivo, 'w', encoding='utf-8') as f:
            json.dump(resultado_completo, f, ensure_ascii=False, indent=2)
        
        self.log(f"✅ JSON salvo em: {caminho_arquivo}")
        return caminho_arquivo
    
    def executar_analise_completa(self) -> str:
        """Executa toda a análise de discrepâncias."""
        self.log("🚀 INICIANDO ANÁLISE COMPLETA DO DISCREPÔMETRO")
        self.log("=" * 60)
        
        try:
            # 1. Validar ambiente
            if not self.validar_ambiente():
                raise Exception("Ambiente inválido - arquivos necessários não encontrados")
            
            # 2. Extrair top 10 produtos
            produtos_top10 = self.extrair_top10_produtos()
            
            # 3. Processar inventários
            produtos_processados = self.processar_inventarios(produtos_top10)
            
            # 4. Calcular discrepâncias
            resultados = self.calcular_discrepancias(produtos_processados)
            
            # 5. Gerar JSON final
            caminho_json = self.gerar_json_final(resultados)
            
            self.log("=" * 60)
            self.log("🎉 ANÁLISE COMPLETA CONCLUÍDA COM SUCESSO!")
            self.log(f"📊 Resultado salvo em: {caminho_json}")
            
            return caminho_json
            
        except Exception as e:
            self.log(f"❌ ERRO CRÍTICO: {str(e)}", "ERRO")
            self.log("Análise interrompida devido a erro")
            raise


def main():
    """
    Função principal - ponto de entrada do programa.
    """
    print("🧠 DISCREPÔMETRO - ANÁLISE FISCAL INTELIGENTE")
        print("=" * 60)
        
    try:
        # Criar orquestrador
        orchestrator = DiscrepometroOrchestrator()
        
        # Executar análise completa
        caminho_resultado = orchestrator.executar_analise_completa()
        
        print(f"\n✅ Análise concluída! Resultado em: {caminho_resultado}")
        print("📊 O arquivo JSON pode ser usado pelo dashboard frontend.")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Erro fatal: {str(e)}")
        print("Verifique os logs acima para mais detalhes.")
        return 1


if __name__ == "__main__":
    # Executar programa principal
    sys.exit(main()) 