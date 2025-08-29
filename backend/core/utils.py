#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UTILS - Módulo com funções auxiliares
====================================

Responsável por:
- Validação de arquivos
- Criação de diretórios
- Funções utilitárias gerais
"""

import os
import logging
from typing import List, Dict, Any

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def validar_arquivos(arquivos: List[str]) -> bool:
    """
    Valida se todos os arquivos necessários existem.
    
    Args:
        arquivos: Lista de caminhos de arquivos
        
    Returns:
        True se todos existem, False caso contrário
    """
    logger.info("🔍 Validando arquivos...")
    
    for arquivo in arquivos:
        if not os.path.exists(arquivo):
            logger.error(f"❌ Arquivo não encontrado: {arquivo}")
            return False
        else:
            logger.info(f"✅ Arquivo encontrado: {arquivo}")
    
    logger.info("✅ Todos os arquivos validados")
    return True


def criar_diretorio_resultados() -> str:
    """
    Cria o diretório de resultados se não existir.
    
    Returns:
        Caminho do diretório de resultados
    """
    diretorio = "resultados"
    
    if not os.path.exists(diretorio):
        os.makedirs(diretorio)
        logger.info(f"📁 Diretório criado: {diretorio}")
    else:
        logger.info(f"📁 Diretório já existe: {diretorio}")
    
    return diretorio


def limpar_nome_arquivo(nome: str) -> str:
    """
    Remove caracteres inválidos do nome do arquivo.
    
    Args:
        nome: Nome original
        
    Returns:
        Nome limpo
    """
    # Caracteres inválidos para nomes de arquivo
    caracteres_invalidos = '<>:"/\\|?*'
    
    for char in caracteres_invalidos:
        nome = nome.replace(char, '_')
    
    return nome


def formatar_tamanho_arquivo(bytes_size: int) -> str:
    """
    Formata o tamanho do arquivo em formato legível.
    
    Args:
        bytes_size: Tamanho em bytes
        
    Returns:
        String formatada (ex: "1.5 MB")
    """
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} TB"


def verificar_espaco_disco(caminho: str, tamanho_necessario: int = 100 * 1024 * 1024) -> bool:
    """
    Verifica se há espaço suficiente no disco.
    
    Args:
        caminho: Caminho para verificar
        tamanho_necessario: Tamanho necessário em bytes (padrão: 100MB)
        
    Returns:
        True se há espaço suficiente
    """
    try:
        statvfs = os.statvfs(caminho)
        espaco_livre = statvfs.f_frsize * statvfs.f_bavail
        
        logger.info(f"💾 Espaço livre: {formatar_tamanho_arquivo(espaco_livre)}")
        logger.info(f"💾 Espaço necessário: {formatar_tamanho_arquivo(tamanho_necessario)}")
        
        return espaco_livre >= tamanho_necessario
        
    except Exception as e:
        logger.warning(f"⚠️ Não foi possível verificar espaço em disco: {str(e)}")
        return True  # Assume que há espaço se não conseguir verificar


def criar_backup_arquivo(caminho_arquivo: str) -> str:
    """
    Cria um backup do arquivo original.
    
    Args:
        caminho_arquivo: Caminho do arquivo original
        
    Returns:
        Caminho do arquivo de backup
    """
    if not os.path.exists(caminho_arquivo):
        logger.warning(f"⚠️ Arquivo não existe para backup: {caminho_arquivo}")
        return ""
    
    import shutil
    from datetime import datetime
    
    # Criar nome do backup
    nome_original = os.path.basename(caminho_arquivo)
    nome_base, extensao = os.path.splitext(nome_original)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    nome_backup = f"{nome_base}_backup_{timestamp}{extensao}"
    
    # Caminho do backup
    diretorio_backup = "backups"
    if not os.path.exists(diretorio_backup):
        os.makedirs(diretorio_backup)
    
    caminho_backup = os.path.join(diretorio_backup, nome_backup)
    
    try:
        shutil.copy2(caminho_arquivo, caminho_backup)
        logger.info(f"💾 Backup criado: {caminho_backup}")
        return caminho_backup
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar backup: {str(e)}")
        return ""


def validar_formato_arquivo(caminho_arquivo: str, formatos_validos: List[str]) -> bool:
    """
    Valida se o arquivo tem um formato válido.
    
    Args:
        caminho_arquivo: Caminho do arquivo
        formatos_validos: Lista de extensões válidas (ex: ['.xlsx', '.pdf'])
        
    Returns:
        True se o formato é válido
    """
    _, extensao = os.path.splitext(caminho_arquivo)
    extensao = extensao.lower()
    
    if extensao in formatos_validos:
        logger.info(f"✅ Formato válido: {extensao}")
        return True
    else:
        logger.error(f"❌ Formato inválido: {extensao}. Válidos: {formatos_validos}")
        return False


def calcular_hash_arquivo(caminho_arquivo: str) -> str:
    """
    Calcula o hash MD5 do arquivo.
    
    Args:
        caminho_arquivo: Caminho do arquivo
        
    Returns:
        Hash MD5 em hexadecimal
    """
    import hashlib
    
    try:
        hash_md5 = hashlib.md5()
        
        with open(caminho_arquivo, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        
        hash_hex = hash_md5.hexdigest()
        logger.info(f"🔐 Hash MD5: {hash_hex}")
        return hash_hex
        
    except Exception as e:
        logger.error(f"❌ Erro ao calcular hash: {str(e)}")
        return ""


def listar_arquivos_diretorio(diretorio: str, extensoes: List[str] = None) -> List[str]:
    """
    Lista arquivos em um diretório com filtro opcional por extensão.
    
    Args:
        diretorio: Caminho do diretório
        extensoes: Lista de extensões para filtrar (opcional)
        
    Returns:
        Lista de caminhos de arquivos
    """
    arquivos = []
    
    try:
        for arquivo in os.listdir(diretorio):
            caminho_completo = os.path.join(diretorio, arquivo)
            
            if os.path.isfile(caminho_completo):
                if extensoes is None:
                    arquivos.append(caminho_completo)
                else:
                    _, extensao = os.path.splitext(arquivo)
                    if extensao.lower() in extensoes:
                        arquivos.append(caminho_completo)
        
        logger.info(f"📁 Encontrados {len(arquivos)} arquivos em {diretorio}")
        return arquivos
        
    except Exception as e:
        logger.error(f"❌ Erro ao listar arquivos: {str(e)}")
        return []


def criar_log_arquivo(nome_arquivo: str = "discrepometro.log") -> str:
    """
    Configura logging para arquivo.
    
    Args:
        nome_arquivo: Nome do arquivo de log
        
    Returns:
        Caminho do arquivo de log
    """
    import logging
    
    # Criar diretório de logs se não existir
    diretorio_logs = "logs"
    if not os.path.exists(diretorio_logs):
        os.makedirs(diretorio_logs)
    
    caminho_log = os.path.join(diretorio_logs, nome_arquivo)
    
    # Configurar logging para arquivo
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(caminho_log, encoding='utf-8'),
            logging.StreamHandler()  # Também mostrar no console
        ]
    )
    
    logger.info(f"📝 Log configurado: {caminho_log}")
    return caminho_log


if __name__ == "__main__":
    # Teste do módulo
    print("🧪 Testando módulo utils...")
    
    try:
        # Testar validação de arquivos
        arquivos_teste = ["main.py", "requirements.txt"]
        valido = validar_arquivos(arquivos_teste)
        print(f"✅ Validação de arquivos: {'OK' if valido else 'ERRO'}")
        
        # Testar criação de diretório
        diretorio = criar_diretorio_resultados()
        print(f"✅ Diretório criado: {diretorio}")
        
        # Testar formatação de tamanho
        tamanho = formatar_tamanho_arquivo(1024 * 1024)  # 1MB
        print(f"✅ Tamanho formatado: {tamanho}")
        
        print("✅ Teste concluído com sucesso")
        
    except Exception as e:
        print(f"❌ Erro no teste: {str(e)}") 