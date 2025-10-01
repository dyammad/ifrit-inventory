# ⚡ Guia Rápido - Ifrit Inventory com IA

## 🚀 Início Rápido (5 minutos)

### **Passo 1: Instalar Dependências**

```bash
# Backend
cd backend
npm install

# Criar arquivo .env
cp .env.example .env
```

### **Passo 2: Configurar OpenAI (ESSENCIAL)**

1. Acesse: https://platform.openai.com/api-keys
2. Crie uma API Key
3. Cole no `.env`:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
```

### **Passo 3: Configurar MongoDB**

**Opção Fácil (MongoDB Atlas - Grátis):**

1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Crie cluster gratuito
3. Obtenha connection string
4. Cole no `.env`:

```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/ifrit
```

**Opção Local:**

```bash
# Instale MongoDB
# Windows: https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt install mongodb

# Inicie
mongod
```

### **Passo 4: Iniciar Backend**

```bash
cd backend
npm start
```

Você verá:
```
🚀 Servidor rodando na porta 3000
✅ MongoDB conectado
🤖 IA habilitada: Sim
```

### **Passo 5: Abrir Frontend**

```bash
# Opção 1: VS Code Live Server
# Clique com direito em index.html > Open with Live Server

# Opção 2: Qualquer servidor HTTP
cd frontend
python -m http.server 5500
```

Acesse: http://localhost:5500

---

## 🎯 Testando as Funcionalidades de IA

### **1. Reconhecimento de Imagem** 📸

**Via Interface:**
1. Abra `frontend/ai-insights.html`
2. Arraste uma foto de um jogo de Final Fantasy
3. A IA identificará automaticamente!

**Via API (cURL):**
```bash
curl -X POST http://localhost:3000/api/ai/analyze-image \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "image=@foto-do-jogo.jpg"
```

### **2. Chatbot Inteligente** 💬

**Via Interface:**
1. Abra `frontend/ai-chatbot.html`
2. Clique no botão flutuante (🤖)
3. Digite: "Adicione Final Fantasy VII para PS1"

**Via API:**
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Mostre meus itens mais raros"}'
```

### **3. Recomendações** 💡

```bash
curl http://localhost:3000/api/ai/recommendations \
  -H "Authorization: Bearer SEU_TOKEN"
```

### **4. Análise de Valor** 💰

```bash
curl -X POST http://localhost:3000/api/ai/predict-value \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemName": "Final Fantasy VII Black Label",
    "rarity": 5,
    "year": 1997,
    "platform": "PS1"
  }'
```

---

## 🔑 Obtendo Token de Autenticação

### **1. Registrar Usuário**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "senha123",
    "name": "Seu Nome"
  }'
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "seu@email.com",
    "name": "Seu Nome",
    "plan": "free"
  }
}
```

### **2. Salvar Token**

**No navegador (JavaScript):**
```javascript
localStorage.setItem('authToken', 'SEU_TOKEN_AQUI');
```

**Em requisições:**
```javascript
fetch('http://localhost:3000/api/items', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📊 Exemplos de Uso

### **Adicionar Item Manualmente**

```bash
curl -X POST http://localhost:3000/api/items \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Final Fantasy VII",
    "category": "Final Fantasy VII",
    "platform": "PS1",
    "rarity": 4,
    "year": 1997,
    "notes": "Black Label, completo com manual"
  }'
```

### **Listar Todos os Itens**

```bash
curl http://localhost:3000/api/items \
  -H "Authorization: Bearer SEU_TOKEN"
```

### **Buscar Itens**

```bash
# Por categoria
curl "http://localhost:3000/api/items?category=Final Fantasy VII" \
  -H "Authorization: Bearer SEU_TOKEN"

# Por plataforma
curl "http://localhost:3000/api/items?platform=PS1" \
  -H "Authorization: Bearer SEU_TOKEN"

# Busca textual
curl "http://localhost:3000/api/items?search=remake" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### **Estatísticas**

```bash
curl http://localhost:3000/api/items/stats/summary \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 🐛 Resolução de Problemas

### **Erro: "OPENAI_API_KEY não configurada"**

✅ **Solução:**
1. Obtenha key em https://platform.openai.com/api-keys
2. Adicione no `.env`: `OPENAI_API_KEY=sk-...`
3. Reinicie o servidor

### **Erro: "MongoDB connection failed"**

✅ **Solução:**
1. Verifique se MongoDB está rodando: `mongod`
2. Ou use MongoDB Atlas (cloud)
3. Verifique `MONGODB_URI` no `.env`

### **Erro: "Token inválido"**

✅ **Solução:**
1. Faça login novamente: `POST /api/auth/login`
2. Salve o novo token
3. Use em todas as requisições

### **Erro: "Limite de IA atingido"**

✅ **Solução:**
- Plano Free: 10 requests/mês
- Upgrade para Basic/Premium
- Ou aguarde o reset mensal

### **IA não está identificando imagens corretamente**

✅ **Dicas:**
- Use fotos claras e bem iluminadas
- Foque na capa/frente do jogo
- Evite reflexos e sombras
- Formatos aceitos: JPG, PNG, WEBP

---

## 💡 Dicas de Uso

### **Comandos do Chatbot**

```
✅ "Adicione Final Fantasy X para PS2"
✅ "Mostre meus jogos de PS1"
✅ "Quanto vale minha coleção?"
✅ "Quais são meus itens mais raros?"
✅ "O que devo comprar a seguir?"
✅ "Organize por raridade"
✅ "Quantos jogos de FF VII eu tenho?"
```

### **Entrada por Voz**

1. Abra o chatbot
2. Clique no ícone do microfone 🎤
3. Fale seu comando
4. A IA processará automaticamente!

### **Upload de Imagem**

**Formatos aceitos:**
- JPG/JPEG
- PNG
- WEBP
- GIF

**Tamanho máximo:** 10MB

**Melhores resultados:**
- Foto da capa frontal
- Boa iluminação
- Foco nítido
- Sem reflexos

---

## 📈 Monitoramento

### **Verificar Status do Servidor**

```bash
curl http://localhost:3000/health
```

**Resposta:**
```json
{
  "status": "ok",
  "timestamp": "2025-09-30T23:03:00.000Z"
}
```

### **Verificar Uso de IA**

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**
```json
{
  "user": {
    "usage": {
      "itemsCount": 25,
      "aiRequestsThisMonth": 7,
      "storageUsed": 1048576
    }
  }
}
```

---

## 🎓 Próximos Passos

1. ✅ Configure o backend e teste a API
2. ✅ Experimente o reconhecimento de imagem
3. ✅ Converse com o chatbot
4. ✅ Veja as recomendações personalizadas
5. 📱 Integre com seu frontend existente
6. 🚀 Deploy em produção (Heroku/Railway)
7. 💳 Configure Stripe para pagamentos

---

## 📚 Recursos Adicionais

- 📖 **README completo:** `README.md`
- 🔧 **Documentação da API:** Swagger em `/api/docs` (TODO)
- 💬 **Suporte:** Abra uma issue no GitHub
- 🎮 **Exemplos:** Pasta `/examples`

---

## ⚡ Comandos Úteis

```bash
# Iniciar backend em modo desenvolvimento
npm run dev

# Rodar testes
npm test

# Limpar banco de dados
mongo ifrit-inventory --eval "db.dropDatabase()"

# Ver logs em tempo real
tail -f logs/app.log

# Backup do banco
mongodump --db ifrit-inventory --out backup/

# Restaurar backup
mongorestore --db ifrit-inventory backup/ifrit-inventory/
```

---

**🔥 Pronto! Agora você tem um SaaS completo com IA funcionando!**

Dúvidas? Consulte o `README.md` ou abra uma issue.
