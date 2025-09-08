# 🏪 App Cantina

Sistema completo de gestão para cantinas com interface moderna em Material Design 3.

## 📋 Funcionalidades

- **👥 Gestão de Pessoas**: Cadastro com foto, depósito inicial e controle de saldo
- **📦 Gestão de Produtos**: Cadastro com leitor de código de barras
- **🛒 Sistema de Compras**: Carrinho de compras com controle de estoque
- **📊 Histórico de Compras**: Visualização detalhada das transações
- **🔍 Busca Inteligente**: Pesquisa por nome ou código de barras
- **📱 Scanner de Códigos**: Integração com câmera + entrada manual

## 🚀 Como Usar o Sistema

### 📋 Pré-requisitos
- Node.js 20.19+ ou 22.12+
- npm (incluído com Node.js)

### 🛠️ Instalação e Execução

```bash
# Se ainda não clonou o projeto
git clone https://github.com/thiagonunes/acampamento.git
cd acampamento/app-cantina

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev                # Aplicação web (navegador)
# OU
npm run electron-dev       # Aplicativo desktop
```

## 📖 Guia de Uso

### 1. 👥 **Gestão de Pessoas**
**Como cadastrar uma pessoa:**
1. Acesse a seção "Pessoas"
2. Clique em "Nova Pessoa"
3. Preencha nome e adicione foto (opcional)
4. Defina depósito inicial
5. Salve o cadastro

**Como adicionar saldo:**
1. Encontre a pessoa na lista
2. Clique em "Adicionar Saldo"
3. Insira o valor e confirme

### 2. 📦 **Gestão de Produtos**
**Como cadastrar um produto:**
1. Acesse "Produtos"
2. Clique em "Novo Produto"
3. Use o scanner ou digite o código de barras
4. Preencha nome, preço e quantidade
5. Salve o produto

**Como atualizar estoque:**
1. Encontre o produto na lista
2. Clique em "Editar"
3. Ajuste a quantidade disponível
4. Confirme as alterações

### 3. 🛒 **Realizar Compras**
**Passo a passo para venda:**
1. Acesse "Compras"
2. Selecione a pessoa compradora
3. Adicione produtos ao carrinho:
   - Use o scanner de código de barras
   - Ou busque por nome
   - Ajuste quantidades conforme necessário
4. Revise o carrinho
5. Confirme a compra

**Recursos do carrinho:**
- ✅ Validação automática de saldo
- ✅ Controle de estoque em tempo real
- ✅ Cálculo automático do total
- ✅ Histórico instantâneo

### 4. 📊 **Consultar Histórico**
**Visualizar compras:**
1. Acesse "Histórico"
2. Filtre por pessoa ou período
3. Veja detalhes de cada transação
4. Exporte relatórios se necessário

### 5. 📱 **Scanner de Códigos**
**Dicas para melhor funcionamento:**
- ✅ Mantenha boa iluminação
- ✅ Centralize o código na câmera
- ✅ Aguarde o foco automático
- ✅ Use "Digitar Código" como alternativa

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev              # Servidor web desenvolvimento
npm run electron-dev     # App desktop desenvolvimento

# Build e Distribuição
npm run build           # Build web para produção
npm run dist           # Build todas as plataformas
npm run dist-win       # Windows (.exe)
npm run dist-mac       # macOS (.dmg)
npm run dist-linux     # Linux (AppImage)

# Ferramentas
npm run lint          # Verificar código
npm run preview       # Visualizar build local
```

## 📦 Distribuição Cross-Platform

### 🌐 **Opção 1: Aplicação Web**
Ideal para acesso universal sem instalação:

```bash
npm run build
# Deploy em Netlify/Vercel/GitHub Pages
# Arquivos em: dist/
```

### 🖥️ **Opção 2: Aplicativo Desktop** (Recomendado)
Melhor para cantinas com uso local:

**macOS/Linux:**
```bash
./build-release.sh      # Script automático
```

**Windows:**
```batch
build-release.bat       # Script automático
```

**Instaladores gerados em:** `release/`

## 💡 Dicas de Uso

### ✨ **Melhores Práticas**
- 📸 **Sempre tire fotos** das pessoas para identificação rápida
- 💰 **Configure depósitos iniciais** adequados para evitar saldo negativo
- 📊 **Monitore o histórico** regularmente para controle financeiro
- 🔄 **Mantenha produtos atualizados** com códigos de barras corretos

### 🚨 **Resolução de Problemas**
- **Câmera não funciona?** Use HTTPS ou permita acesso à câmera
- **Produto não encontrado?** Verifique se o código foi cadastrado corretamente
- **Saldo insuficiente?** Adicione crédito na conta da pessoa
- **App lento?** Use a versão desktop para melhor performance

## 🌟 Vantagens por Plataforma

### 🖥️ **Desktop** (Recomendado para Cantinas)
✅ Funciona offline  
✅ Acesso garantido à câmera  
✅ Interface nativa rápida  
✅ Dados seguros localmente  
✅ Fácil distribuição

### 🌐 **Web**
✅ Acesso de qualquer lugar  
✅ Sem instalação necessária  
✅ Atualizações automáticas  
✅ Funciona em tablets/celulares

## 📱 Compatibilidade

- **Desktop**: Windows 10+, macOS 10.15+, Ubuntu 18+
- **Web**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: Navegadores modernos (PWA)

## 🛡️ Segurança e Dados

- 🔒 **Dados locais**: Tudo armazenado no dispositivo
- 🔐 **Interface isolada**: Proteção contra acesso externo
- ✅ **Validações**: Inputs sanitizados e validados
- 🛠️ **Backup**: Dados em localStorage (recomenda-se backup manual)

---

**Desenvolvido com ❤️ usando React, TypeScript, Material-UI e Electron**

Para mais informações sobre o projeto completo, consulte o [README principal](../README.md).