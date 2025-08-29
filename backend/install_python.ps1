# Script PowerShell para instalar Python automaticamente
# ===================================================

Write-Host "🚀 INSTALANDO PYTHON AUTOMATICAMENTE..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# URL do Python mais recente
$pythonUrl = "https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe"
$installerPath = "$env:TEMP\python-installer.exe"

Write-Host "📥 Baixando Python 3.12.0..." -ForegroundColor Yellow

try {
    # Baixar o instalador
    Invoke-WebRequest -Uri $pythonUrl -OutFile $installerPath
    
    Write-Host "✅ Download concluído!" -ForegroundColor Green
    Write-Host "🔧 Instalando Python..." -ForegroundColor Yellow
    
    # Instalar Python com todas as opções necessárias
    $arguments = @(
        "/quiet",                    # Instalação silenciosa
        "InstallAllUsers=1",        # Instalar para todos os usuários
        "PrependPath=1",            # Adicionar ao PATH
        "Include_test=0",           # Não incluir testes
        "Include_pip=1",            # Incluir pip
        "Include_doc=0",            # Não incluir documentação
        "Include_dev=0"             # Não incluir ferramentas de desenvolvimento
    )
    
    Start-Process -FilePath $installerPath -ArgumentList $arguments -Wait
    
    Write-Host "✅ Python instalado com sucesso!" -ForegroundColor Green
    
    # Limpar arquivo temporário
    Remove-Item $installerPath -Force
    
    Write-Host "🔄 Atualizando variáveis de ambiente..." -ForegroundColor Yellow
    
    # Recarregar variáveis de ambiente
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "🧪 Testando instalação..." -ForegroundColor Yellow
    
    # Testar se Python está funcionando
    try {
        $pythonVersion = python --version 2>&1
        Write-Host "✅ Python funcionando: $pythonVersion" -ForegroundColor Green
        
        $pipVersion = python -m pip --version 2>&1
        Write-Host "✅ Pip funcionando: $pipVersion" -ForegroundColor Green
        
        Write-Host "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
        Write-Host "1. Instalar dependências: pip install -r requirements.txt" -ForegroundColor White
        Write-Host "2. Testar sistema: python test_simple.py" -ForegroundColor White
        Write-Host "3. Iniciar API: python start_server.py" -ForegroundColor White
        
    } catch {
        Write-Host "⚠️ Python instalado, mas pode precisar reiniciar o terminal" -ForegroundColor Yellow
        Write-Host "💡 Feche e abra um novo terminal, depois tente novamente" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Erro durante a instalação: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Tente instalar manualmente: https://www.python.org/downloads/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
