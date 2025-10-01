# 🏗️ Arquitetura do Sistema - Ifrit Inventory SaaS

## 📁 Estrutura de Diretórios

```
ifrit-inventory/
│
├── backend/                          # Backend Node.js + Express
│   ├── config/
│   │   └── database.js              # Configuração MongoDB
│   ├── models/
│   │   ├── User.js                  # Schema de usuários
│   │   └── Item.js                  # Schema de itens
│   ├── routes/
│   │   ├── auth.js                  # Autenticação (login/registro)
│   │   ├── items.js                 # CRUD de itens
│   │   ├── ai.js                    # Endpoints de IA
│   │   ├── analytics.js             # Estatísticas e analytics
│   │   └── webhooks.js              # Webhooks (Stripe)
│   ├── services/
│   │   ├── aiVision.js              # Reconhecimento de imagem
│   │   ├── aiRecommendations.js     # Sistema de recomendações
│   │   └── aiChatbot.js             # Chatbot inteligente
│   ├── middleware/
│   │   ├── auth.js                  # Middleware de autenticação
│   │   └── errorHandler.js          # Tratamento de erros
│   ├── .env.example                 # Exemplo de variáveis de ambiente
│   ├── package.json                 # Dependências do backend
│   ├── Dockerfile                   # Container Docker
│   └── server.js                    # Servidor principal
│
├── frontend/                         # Frontend (Vanilla JS)
│   ├── ai-chatbot.html              # Interface do chatbot
│   ├── ai-chatbot.css               # Estilos do chatbot
│   ├── ai-chatbot.js                # Lógica do chatbot
│   ├── ai-insights.html             # Dashboard de insights
│   ├── ai-insights.css              # Estilos do dashboard
│   └── ai-insights.js               # Lógica do dashboard
│
├── docker-compose.yml               # Orquestração de containers
├── .dockerignore                    # Arquivos ignorados pelo Docker
├── start.bat                        # Script de inicialização (Windows)
├── start.sh                         # Script de inicialização (Linux/Mac)
├── README.md                        # Documentação principal
├── GUIA-RAPIDO.md                   # Guia de início rápido
├── CONCEITO-BMAD.md                 # Explicação do framework
└── ARQUITETURA.md                   # Este arquivo
```

---

## 🔄 Fluxo de Dados

### **1. Autenticação**

```
Cliente                API Gateway           Backend              Database
  │                         │                    │                    │
  │─── POST /auth/register ─→│                    │                    │
  │                         │─── Validar dados ──→│                    │
  │                         │                    │─── Hash password ──→│
  │                         │                    │←─── Save user ─────│
  │                         │←─── JWT Token ─────│                    │
  │←─── Token + User ───────│                    │                    │
```

### **2. Reconhecimento de Imagem**

```
Cliente                API Gateway           AI Service           Backend
  │                         │                    │                    │
  │─── POST /ai/analyze ───→│                    │                    │
  │     + image             │─── Check limits ───→│                    │
  │                         │                    │                    │
  │                         │─── Send image ─────→│                    │
  │                         │                    │─ GPT-4 Vision ─→   │
  │                         │                    │← Item data ────    │
  │                         │                    │                    │
  │                         │                    │─── Enrich IGDB ───→│
  │                         │←─── Item details ──│                    │
  │←─── Detected item ──────│                    │                    │
```

### **3. Chatbot Conversacional**

```
Cliente                API Gateway           AI Service           Backend
  │                         │                    │                    │
  │─── POST /ai/chat ──────→│                    │                    │
  │     "Adicione FF VII"   │─── Get context ────→│                    │
  │                         │                    │                    │
  │                         │─── Send message ───→│                    │
  │                         │                    │─ GPT-4 Chat ──→    │
  │                         │                    │← Response + Action │
  │                         │                    │                    │
  │                         │                    │─── Execute action ─→│
  │                         │                    │                    │─ Save item
  │                         │←─── Result ─────────│←─── Success ───────│
  │←─── Message + Item ─────│                    │                    │
```

### **4. Real-time Updates (WebSocket)**

```
Cliente A              WebSocket Server      Backend              Cliente B
  │                         │                    │                    │
  │─── Connect ────────────→│                    │                    │
  │                         │← join-inventory ───│                    │
  │                         │                    │                    │
  │─── Add item ───────────→│                    │                    │
  │                         │─── Save ───────────→│                    │
  │                         │                    │                    │
  │                         │─── Emit event ─────→│─── item-added ────→│
  │                         │                    │                    │
```

---

## 🗄️ Modelo de Dados

### **User (Usuário)**

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: "user" | "admin" | "premium",
  subscription: {
    plan: "free" | "basic" | "premium" | "enterprise",
    status: "active" | "inactive" | "cancelled" | "trial",
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date
  },
  preferences: {
    language: String,
    theme: String,
    notifications: Boolean,
    aiAssistant: Boolean
  },
  usage: {
    itemsCount: Number,
    aiRequestsThisMonth: Number,
    storageUsed: Number
  },
  createdAt: Date,
  lastLogin: Date
}
```

### **Item (Item da Coleção)**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String,
  category: String,
  platform: String,
  rarity: Number (0-5),
  year: Number,
  notes: String,
  image: {
    url: String,
    thumbnail: String,
    size: Number
  },
  metadata: {
    igdbId: String,
    detectedBy: "manual" | "ai-vision" | "ai-ocr" | "api",
    confidence: Number (0-1),
    tags: [String],
    estimatedValue: Number
  },
  aiInsights: {
    recommendations: [String],
    similarItems: [ObjectId],
    marketTrends: String,
    lastAnalyzed: Date
  },
  status: "owned" | "wishlist" | "sold" | "traded",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Endpoints

### **Autenticação**

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Registrar usuário | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/auth/me` | Obter perfil | ✅ |
| PUT | `/api/auth/profile` | Atualizar perfil | ✅ |

### **Itens**

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/items` | Listar itens | ✅ |
| GET | `/api/items/:id` | Obter item | ✅ |
| POST | `/api/items` | Adicionar item | ✅ |
| PUT | `/api/items/:id` | Atualizar item | ✅ |
| DELETE | `/api/items/:id` | Deletar item | ✅ |
| GET | `/api/items/stats/summary` | Estatísticas | ✅ |

### **IA**

| Método | Endpoint | Descrição | Auth | Limite |
|--------|----------|-----------|------|--------|
| GET | `/api/ai/recommendations` | Recomendações | ✅ | ✅ |
| POST | `/api/ai/predict-value` | Prever valor | ✅ | ✅ |
| GET | `/api/ai/organize` | Sugerir organização | ✅ | ✅ |
| GET | `/api/ai/trends` | Análise de tendências | ✅ | ❌ |
| POST | `/api/ai/chat` | Chatbot | ✅ | ✅ |
| GET | `/api/ai/chat/suggestions` | Sugestões | ✅ | ❌ |
| DELETE | `/api/ai/chat/history` | Limpar histórico | ✅ | ❌ |
| POST | `/api/ai/analyze-image` | Analisar imagem | ✅ | ✅ |
| GET | `/api/ai/insights` | Dashboard completo | ✅ | ✅ |

### **Analytics**

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/analytics/dashboard` | Dashboard | ✅ |
| GET | `/api/analytics/export` | Exportar dados | ✅ |

### **Webhooks**

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/webhooks/stripe` | Webhook Stripe | ❌ |

---

## 🔒 Segurança

### **Autenticação**
- JWT (JSON Web Tokens)
- Tokens expiram em 7 dias
- Refresh tokens (TODO)

### **Autorização**
- Middleware `authenticate` em todas as rotas protegidas
- Verificação de plano para recursos premium
- Rate limiting por IP e por usuário

### **Proteções**
- ✅ Helmet.js (security headers)
- ✅ CORS configurado
- ✅ Rate limiting (100 req/15min)
- ✅ Input validation (Joi)
- ✅ SQL/NoSQL injection protection
- ✅ XSS protection
- ✅ CSRF tokens (TODO)

### **Dados Sensíveis**
- Senhas com bcrypt (12 rounds)
- API keys em variáveis de ambiente
- Logs sem informações sensíveis

---

## 🚀 Escalabilidade

### **Horizontal Scaling**

```
                    Load Balancer
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    Backend 1        Backend 2        Backend 3
        │                │                │
        └────────────────┼────────────────┘
                         │
                    MongoDB Cluster
```

### **Caching Strategy**

```
Cliente → CDN → Redis Cache → Backend → MongoDB
```

**Cache Layers:**
1. **CDN**: Assets estáticos (CSS, JS, imagens)
2. **Redis**: Sessões, resultados de IA, queries frequentes
3. **MongoDB**: Dados persistentes

### **Microserviços (Futuro)**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Auth      │     │   Items     │     │     AI      │
│  Service    │     │  Service    │     │  Service    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    API Gateway
```

---

## 📊 Monitoramento

### **Métricas Técnicas**
- Response time (p50, p95, p99)
- Error rate
- Request rate
- Database queries
- AI API calls

### **Métricas de Negócio**
- Usuários ativos (DAU/MAU)
- Conversão Free → Paid
- Churn rate
- MRR (Monthly Recurring Revenue)
- Uso de IA por plano

### **Ferramentas**
- **Logs**: Winston + CloudWatch
- **APM**: New Relic / Datadog
- **Errors**: Sentry
- **Analytics**: Mixpanel / Amplitude

---

## 🧪 Testes

### **Estrutura de Testes**

```
backend/
├── __tests__/
│   ├── unit/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   ├── auth.test.js
│   │   ├── items.test.js
│   │   └── ai.test.js
│   └── e2e/
│       └── flows.test.js
```

### **Cobertura Desejada**
- Unit tests: > 80%
- Integration tests: > 70%
- E2E tests: Fluxos críticos

---

## 🐳 Docker & Deploy

### **Desenvolvimento Local**

```bash
docker-compose up
```

**Serviços:**
- MongoDB (porta 27017)
- Backend (porta 3000)
- Frontend (porta 5500)
- Redis (porta 6379)

### **Produção**

**Opções de Deploy:**

1. **Heroku**
```bash
git push heroku main
```

2. **Railway**
```bash
railway up
```

3. **AWS ECS**
```bash
aws ecs deploy
```

4. **Kubernetes**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ifrit-backend
spec:
  replicas: 3
  ...
```

---

## 💡 Próximas Melhorias

### **Curto Prazo**
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Documentação Swagger
- [ ] Logs estruturados

### **Médio Prazo**
- [ ] Redis para cache
- [ ] Background jobs (Bull)
- [ ] Email notifications
- [ ] Admin dashboard

### **Longo Prazo**
- [ ] Microserviços
- [ ] GraphQL API
- [ ] Mobile app (React Native)
- [ ] Blockchain integration

---

## 📚 Referências

- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices
- **OpenAI API Docs**: https://platform.openai.com/docs
- **MongoDB Schema Design**: https://www.mongodb.com/docs/manual/data-modeling/
- **JWT Authentication**: https://jwt.io/introduction
- **Stripe Integration**: https://stripe.com/docs/api

---

**Arquitetura desenvolvida seguindo o framework BMAD para máxima escalabilidade e manutenibilidade.**
