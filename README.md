# 🔥 Ifrit Inventory - SaaS com IA

**Sistema completo de gerenciamento de inventário de Final Fantasy com Inteligência Artificial integrada**

## 🚀 Funcionalidades Principais

### 🤖 **IA Integrada (BMAD Framework)**

#### 1. **Reconhecimento de Imagem (AI Vision)**
- 📸 Tire uma foto de qualquer jogo/item de Final Fantasy
- 🔍 IA identifica automaticamente: nome, plataforma, categoria, ano, raridade
- 🎯 Usa GPT-4 Vision + OCR (Tesseract) como fallback
- ✨ Enriquecimento automático com dados da IGDB API

#### 2. **Recomendações Inteligentes**
- 💡 Análise da sua coleção atual
- 🎯 Sugestões personalizadas de próximas compras
- 📊 Identificação de lacunas na coleção
- 💰 Estimativa de valor de mercado
- 📈 Análise de potencial de investimento

#### 3. **Chatbot com IA (Ifrit Assistant)**
- 💬 Gerenciamento via linguagem natural
- 🗣️ Entrada por voz (Speech Recognition)
- ⚡ Comandos como: "adicione Final Fantasy VII para PS1"
- 🔎 Busca inteligente: "mostre meus jogos mais raros"
- 📊 Análises: "quanto vale minha coleção?"

#### 4. **Análise Preditiva**
- 📈 Tendências de crescimento da coleção
- 💹 Previsão de valorização de itens
- 🎲 Detecção automática de duplicatas
- 🏆 Identificação de itens raros e valiosos

#### 5. **Organização Inteligente**
- 🗂️ Sugestões de como organizar sua coleção
- 📋 Estratégias baseadas em seus padrões
- 🎨 Categorização automática

---

## 🏗️ Arquitetura BMAD (Backend + ML + API + Dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Dashboard)                      │
│  • React/Vanilla JS  • Real-time Updates  • PWA Support    │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER (Gateway)                     │
│  • REST API  • WebSockets  • Rate Limiting  • Auth (JWT)   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌──────────────────────┬──────────────────────────────────────┐
│   BACKEND (Node.js)  │     MACHINE LEARNING (AI)            │
│  • Express Server    │  • GPT-4 Vision (Image Recognition)  │
│  • MongoDB Database  │  • GPT-4 (Chatbot & Recommendations) │
│  • Multi-tenant      │  • Tesseract.js (OCR)                │
│  • Stripe Payments   │  • Embeddings (Similarity Detection) │
└──────────────────────┴──────────────────────────────────────┘
```

---

## 📦 Instalação e Configuração

### **1. Backend Setup**

```bash
cd backend
npm install
```

Crie um arquivo `.env` baseado no `.env.example`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ifrit-inventory

# JWT
JWT_SECRET=seu-secret-super-seguro-aqui
JWT_EXPIRES_IN=7d

# OpenAI (OBRIGATÓRIO para IA)
OPENAI_API_KEY=sk-your-openai-api-key

# Anthropic Claude (Opcional)
ANTHROPIC_API_KEY=sk-ant-your-key

# IGDB API (Opcional - dados de jogos)
IGDB_CLIENT_ID=your-igdb-client-id
IGDB_CLIENT_SECRET=your-igdb-secret

# Stripe (Opcional - pagamentos)
STRIPE_SECRET_KEY=sk_test_your-stripe-key
```

**Iniciar o servidor:**

```bash
npm start
# ou para desenvolvimento com hot-reload:
npm run dev
```

### **2. Frontend Setup**

Abra o `frontend/` em um servidor local:

```bash
# Opção 1: Live Server (VS Code)
# Clique com botão direito em index.html > Open with Live Server

# Opção 2: Python
python -m http.server 5500

# Opção 3: Node.js
npx serve frontend
```

### **3. MongoDB Setup**

**Opção A: Local**
```bash
# Instale MongoDB Community Edition
# https://www.mongodb.com/try/download/community

# Inicie o serviço
mongod
```

**Opção B: MongoDB Atlas (Cloud - Recomendado)**
1. Crie conta em https://www.mongodb.com/cloud/atlas
2. Crie um cluster gratuito
3. Obtenha a connection string
4. Cole no `.env` como `MONGODB_URI`

---

## 🔑 Obtendo API Keys

### **OpenAI (ESSENCIAL para IA)**
1. Acesse: https://platform.openai.com/
2. Crie uma conta
3. Vá em API Keys > Create new secret key
4. Cole no `.env` como `OPENAI_API_KEY`
5. **Custo**: ~$0.01 por análise de imagem, ~$0.002 por chat

### **IGDB (Opcional - dados de jogos)**
1. Acesse: https://api-docs.igdb.com/
2. Registre-se via Twitch
3. Obtenha Client ID e Secret
4. Cole no `.env`

### **Stripe (Opcional - pagamentos SaaS)**
1. Acesse: https://stripe.com/
2. Crie conta
3. Obtenha chaves de teste
4. Cole no `.env`

---

## 🎯 Como Usar

### **1. Registro e Login**

```bash
# Endpoint: POST /api/auth/register
{
  "email": "seu@email.com",
  "password": "senha123",
  "name": "Seu Nome"
}

# Resposta:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

Use o `token` em todas as requisições:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

### **2. Adicionar Item com IA (Reconhecimento de Imagem)**

```bash
# Endpoint: POST /api/items
# Content-Type: multipart/form-data

# Envie uma imagem do jogo
# A IA identificará automaticamente!
```

**Exemplo com cURL:**
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "image=@caminho/para/foto-do-jogo.jpg"
```

### **3. Chatbot - Gerenciar por Voz/Texto**

```bash
# Endpoint: POST /api/ai/chat
{
  "message": "Adicione Final Fantasy VII Remake para PS5"
}

# Resposta:
{
  "message": "Claro! Adicionei Final Fantasy VII Remake...",
  "action": {
    "action": "add_item",
    "item": { ... }
  },
  "actionResult": {
    "success": true,
    "item": { ... }
  }
}
```

### **4. Obter Recomendações**

```bash
# Endpoint: GET /api/ai/recommendations

# Resposta:
{
  "recommendations": [
    {
      "name": "Final Fantasy X HD Remaster",
      "reason": "Você tem vários jogos de PS2, mas falta este clássico",
      "priority": "alta",
      "estimatedValue": "R$ 80 - 120",
      "category": "Final Fantasy X"
    }
  ]
}
```

### **5. Análise de Valor**

```bash
# Endpoint: POST /api/ai/predict-value
{
  "itemName": "Final Fantasy VII Black Label PS1",
  "rarity": 5,
  "year": 1997,
  "platform": "PS1"
}

# Resposta:
{
  "prediction": {
    "estimatedValue": {
      "min": 800,
      "max": 1500,
      "average": 1150
    },
    "trend": "crescente",
    "investmentPotential": "alto"
  }
}
```

---

## 📊 Planos SaaS

| Recurso | Free | Basic | Premium | Enterprise |
|---------|------|-------|---------|------------|
| **Itens** | 50 | 500 | 5.000 | Ilimitado |
| **IA Requests/mês** | 10 | 100 | 1.000 | Ilimitado |
| **Reconhecimento de Imagem** | ✅ | ✅ | ✅ | ✅ |
| **Chatbot** | ✅ | ✅ | ✅ | ✅ |
| **Recomendações** | ❌ | ✅ | ✅ | ✅ |
| **Análise Preditiva** | ❌ | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ | ✅ |
| **Suporte Prioritário** | ❌ | ❌ | ❌ | ✅ |
| **Preço** | Grátis | R$ 19/mês | R$ 49/mês | R$ 199/mês |

---

## 🛠️ Stack Tecnológica

### **Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Socket.io (Real-time)
- Multer (Upload)
- Sharp (Image Processing)

### **IA/ML**
- OpenAI GPT-4 Vision
- OpenAI GPT-4 (Chat)
- Tesseract.js (OCR)
- Text Embeddings (Similarity)

### **Frontend**
- Vanilla JavaScript (ou React)
- CSS3 + Animations
- Font Awesome Icons
- Web Speech API
- Service Workers (PWA)

### **Infraestrutura**
- MongoDB Atlas (Database)
- Stripe (Payments)
- WebSockets (Real-time)
- Rate Limiting
- CORS + Helmet (Security)

---

## 📡 Endpoints da API

### **Autenticação**
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter perfil
- `PUT /api/auth/profile` - Atualizar perfil

### **Itens**
- `GET /api/items` - Listar itens
- `GET /api/items/:id` - Obter item
- `POST /api/items` - Adicionar item (com IA)
- `PUT /api/items/:id` - Atualizar item
- `DELETE /api/items/:id` - Deletar item
- `GET /api/items/stats/summary` - Estatísticas

### **IA**
- `GET /api/ai/recommendations` - Recomendações
- `POST /api/ai/predict-value` - Prever valor
- `GET /api/ai/organize` - Sugerir organização
- `GET /api/ai/trends` - Análise de tendências
- `POST /api/ai/chat` - Chatbot
- `GET /api/ai/chat/suggestions` - Sugestões de comandos
- `DELETE /api/ai/chat/history` - Limpar histórico
- `POST /api/ai/analyze-image` - Analisar imagem
- `GET /api/ai/insights` - Dashboard completo

### **Analytics**
- `GET /api/analytics/dashboard` - Dashboard completo
- `GET /api/analytics/export` - Exportar dados

---

## 🎨 Interface do Usuário

### **1. Dashboard Principal**
- Grid de itens com filtros
- Estatísticas em tempo real
- Últimos itens adicionados
- Conquistas e progresso

### **2. Chatbot (Floating)**
- Botão flutuante no canto inferior direito
- Interface de chat moderna
- Sugestões rápidas
- Entrada por voz

### **3. AI Insights**
- Recomendações personalizadas
- Análise de tendências
- Sugestão de organização
- Upload de imagem para reconhecimento

---

## 🔒 Segurança

- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ Rate Limiting
- ✅ CORS Protection
- ✅ Helmet.js (Security Headers)
- ✅ Input Validation (Joi)
- ✅ MongoDB Injection Protection
- ✅ File Upload Validation

---

## 🚀 Deploy

### **Backend (Heroku/Railway/Render)**

```bash
# 1. Criar Procfile
echo "web: node server.js" > Procfile

# 2. Deploy
git push heroku main
```

### **Frontend (Vercel/Netlify)**

```bash
# 1. Build (se usar React)
npm run build

# 2. Deploy
vercel --prod
```

### **Database (MongoDB Atlas)**
- Já está na nuvem! ☁️

---

## 📈 Roadmap Futuro

- [ ] Integração com marketplaces (eBay, Mercado Livre)
- [ ] Notificações de preços (alertas de ofertas)
- [ ] Compartilhamento social de coleção
- [ ] Modo competitivo (rankings)
- [ ] Integração com blockchain (NFTs)
- [ ] App mobile (React Native)
- [ ] Suporte a outras franquias de jogos

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

MIT License - Sinta-se livre para usar em projetos pessoais e comerciais.

---

## 💬 Suporte

- 📧 Email: suporte@ifrit-inventory.com
- 💬 Discord: [Link do servidor]
- 📖 Documentação: https://docs.ifrit-inventory.com

---

## 🎮 Sobre Final Fantasy

Este projeto é um tributo à lendária franquia Final Fantasy da Square Enix. 
Não somos afiliados à Square Enix - apenas fãs apaixonados! 🔥

---

**Desenvolvido com ❤️ por colecionadores, para colecionadores**

🔥 **Ifrit Inventory** - Organize sua paixão por Final Fantasy com o poder da IA!
