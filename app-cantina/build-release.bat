@echo off
REM Script para gerar releases do App Cantina no Windows

echo 🚀 Iniciando build de release do App Cantina...

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não encontrado. Instale Node.js primeiro.
    pause
    exit /B 1
)

REM Verificar se npm está instalado
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm não encontrado. Instale npm primeiro.
    pause
    exit /B 1
)

echo 📦 Instalando dependências...
npm install

echo 🏗️  Fazendo build da aplicação web...
npm run build

echo 📱 Escolha o tipo de release:
echo 1. Windows (.exe)
echo 2. macOS (.dmg)
echo 3. Linux (AppImage)
echo 4. Todas as plataformas

set /p choice="Digite sua escolha (1-4): "

if "%choice%"=="1" (
    echo 🪟 Gerando release para Windows...
    npm run dist-win
    echo ✅ Release Windows gerada em: release/
) else if "%choice%"=="2" (
    echo 🍎 Gerando release para macOS...
    npm run dist-mac
    echo ✅ Release macOS gerada em: release/
) else if "%choice%"=="3" (
    echo 🐧 Gerando release para Linux...
    npm run dist-linux
    echo ✅ Release Linux gerada em: release/
) else if "%choice%"=="4" (
    echo 🌍 Gerando releases para todas as plataformas...
    npm run dist-win
    npm run dist-mac
    npm run dist-linux
    echo ✅ Todas as releases geradas em: release/
) else (
    echo ❌ Opção inválida. Saindo...
    pause
    exit /B 1
)

echo 🎉 Build concluído com sucesso!
echo 📁 Arquivos de instalação disponíveis em: release/

REM Listar arquivos gerados
echo 📋 Arquivos gerados:
dir release\ 2>nul || echo Nenhum arquivo encontrado na pasta release/

pause