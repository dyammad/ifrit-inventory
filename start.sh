#!/bin/bash

echo "========================================"
echo "  IFRIT INVENTORY - SaaS com IA"
echo "========================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
echo "[1/5] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERRO] Node.js não encontrado!${NC}"
    echo "Por favor, instale Node.js: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js instalado: $(node --version)${NC}"

# Verificar MongoDB
echo "[2/5] Verificando MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${YELLOW}[AVISO] MongoDB não está rodando${NC}"
    echo "Tentando iniciar MongoDB..."
    if command -v mongod &> /dev/null; then
        mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb-data
        sleep 2
    else
        echo -e "${YELLOW}MongoDB não encontrado. Use MongoDB Atlas ou instale localmente.${NC}"
    fi
else
    echo -e "${GREEN}✓ MongoDB rodando${NC}"
fi

# Instalar dependências
echo "[3/5] Instalando dependências do backend..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}✓ Dependências já instaladas${NC}"
fi

# Verificar .env
echo "[4/5] Verificando configuração..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[AVISO] Arquivo .env não encontrado!${NC}"
    cp .env.example .env
    echo ""
    echo "========================================"
    echo "  IMPORTANTE: Configure suas API Keys!"
    echo "========================================"
    echo ""
    echo "Edite o arquivo backend/.env e adicione:"
    echo "  - OPENAI_API_KEY (obrigatório para IA)"
    echo "  - MONGODB_URI (se usar MongoDB Atlas)"
    echo ""
    read -p "Pressione Enter para continuar..."
fi

# Iniciar backend
echo "[5/5] Iniciando servidor backend..."
npm start &
BACKEND_PID=$!

# Aguardar servidor iniciar
echo "Aguardando servidor iniciar..."
sleep 5

# Verificar se backend iniciou
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend iniciado com sucesso!${NC}"
else
    echo -e "${RED}[ERRO] Falha ao iniciar backend${NC}"
    exit 1
fi

# Abrir navegador
echo "Abrindo frontend..."
cd ..

# Detectar SO e abrir navegador
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:5500/frontend/ai-chatbot.html
    open http://localhost:5500/frontend/ai-insights.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:5500/frontend/ai-chatbot.html &
    xdg-open http://localhost:5500/frontend/ai-insights.html &
fi

echo ""
echo "========================================"
echo "  IFRIT INVENTORY INICIADO!"
echo "========================================"
echo ""
echo -e "${GREEN}Backend API:${NC} http://localhost:3000"
echo -e "${GREEN}Frontend:${NC} http://localhost:5500"
echo ""
echo -e "${GREEN}Chatbot:${NC} http://localhost:5500/frontend/ai-chatbot.html"
echo -e "${GREEN}Insights:${NC} http://localhost:5500/frontend/ai-insights.html"
echo ""
echo "Pressione Ctrl+C para parar os servidores"
echo "========================================"
echo ""

# Aguardar interrupção
trap "kill $BACKEND_PID; exit" INT TERM
wait $BACKEND_PID
