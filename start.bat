@echo off
echo ========================================
echo   IFRIT INVENTORY - SaaS com IA
echo ========================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se MongoDB está rodando
echo [1/5] Verificando MongoDB...
netstat -an | find "27017" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [AVISO] MongoDB nao esta rodando na porta 27017
    echo Iniciando MongoDB...
    start mongod
    timeout /t 3 >nul
)

REM Instalar dependências do backend
echo [2/5] Instalando dependencias do backend...
cd backend
if not exist node_modules (
    call npm install
) else (
    echo Dependencias ja instaladas!
)

REM Verificar arquivo .env
echo [3/5] Verificando configuracao...
if not exist .env (
    echo [AVISO] Arquivo .env nao encontrado!
    echo Copiando .env.example para .env...
    copy .env.example .env
    echo.
    echo ========================================
    echo   IMPORTANTE: Configure suas API Keys!
    echo ========================================
    echo.
    echo Edite o arquivo backend\.env e adicione:
    echo   - OPENAI_API_KEY (obrigatorio para IA)
    echo   - MONGODB_URI (se usar MongoDB Atlas)
    echo.
    echo Pressione qualquer tecla para abrir o arquivo...
    pause >nul
    notepad .env
)

REM Iniciar backend
echo [4/5] Iniciando servidor backend...
start "Ifrit Backend" cmd /k "npm start"

REM Aguardar servidor iniciar
echo Aguardando servidor iniciar...
timeout /t 5 >nul

REM Iniciar frontend
echo [5/5] Abrindo frontend...
cd ..
start http://localhost:5500/frontend/ai-chatbot.html
start http://localhost:5500/frontend/ai-insights.html

echo.
echo ========================================
echo   IFRIT INVENTORY INICIADO!
echo ========================================
echo.
echo Backend API: http://localhost:3000
echo Frontend: http://localhost:5500
echo.
echo Chatbot: http://localhost:5500/frontend/ai-chatbot.html
echo Insights: http://localhost:5500/frontend/ai-insights.html
echo.
echo Pressione Ctrl+C para parar os servidores
echo ========================================
echo.

REM Manter janela aberta
pause
