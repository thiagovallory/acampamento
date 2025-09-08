#!/bin/bash

# Script para gerar releases do App Cantina
# Compatível com macOS e Linux (para Windows, use o PowerShell equivalente)

set -e

echo "🚀 Iniciando build de release do App Cantina..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js primeiro."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale npm primeiro."
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

echo "🏗️  Fazendo build da aplicação web..."
npm run build

echo "📱 Escolha o tipo de release:"
echo "1. macOS (.dmg)"
echo "2. Windows (.exe)"
echo "3. Linux (AppImage)"
echo "4. Todas as plataformas"

read -p "Digite sua escolha (1-4): " choice

case $choice in
    1)
        echo "🍎 Gerando release para macOS..."
        npm run dist-mac
        echo "✅ Release macOS gerada em: release/"
        ;;
    2)
        echo "🪟 Gerando release para Windows..."
        npm run dist-win
        echo "✅ Release Windows gerada em: release/"
        ;;
    3)
        echo "🐧 Gerando release para Linux..."
        npm run dist-linux
        echo "✅ Release Linux gerada em: release/"
        ;;
    4)
        echo "🌍 Gerando releases para todas as plataformas..."
        npm run dist-mac
        npm run dist-win
        npm run dist-linux
        echo "✅ Todas as releases geradas em: release/"
        ;;
    *)
        echo "❌ Opção inválida. Saindo..."
        exit 1
        ;;
esac

echo "🎉 Build concluído com sucesso!"
echo "📁 Arquivos de instalação disponíveis em: release/"

# Listar arquivos gerados
echo "📋 Arquivos gerados:"
ls -la release/ 2>/dev/null || echo "Nenhum arquivo encontrado na pasta release/"