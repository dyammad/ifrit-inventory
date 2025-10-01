# 📱 PWA Setup - Progressive Web App

## 🎯 Transforme em App Instalável

O Ifrit Inventory está configurado como **PWA (Progressive Web App)**, permitindo instalação em dispositivos móveis e desktop como um aplicativo nativo.

---

## ✅ Recursos PWA Implementados

- ✅ **Instalável** - Pode ser instalado na home screen
- ✅ **Offline-first** - Service Worker para cache
- ✅ **App-like** - Funciona como app nativo
- ✅ **Fast** - Carregamento instantâneo
- ✅ **Responsive** - Adapta a qualquer tela
- ✅ **Secure** - Requer HTTPS

---

## 📋 Manifest (manifest.webmanifest)

```json
{
  "name": "Ifrit Inventory - Coleção Final Fantasy",
  "short_name": "Ifrit Inventory",
  "description": "Gerencie sua coleção de Final Fantasy com IA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f13",
  "theme_color": "#ff4d2e",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "assets/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["productivity", "utilities"],
  "screenshots": [
    {
      "src": "assets/screenshot-mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "assets/screenshot-desktop.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "shortcuts": [
    {
      "name": "Adicionar Item",
      "short_name": "Adicionar",
      "description": "Adicionar novo item à coleção",
      "url": "/?action=add",
      "icons": [{ "src": "assets/icon-add.png", "sizes": "96x96" }]
    },
    {
      "name": "Chatbot IA",
      "short_name": "Chatbot",
      "description": "Abrir assistente de IA",
      "url": "/frontend/ai-chatbot.html",
      "icons": [{ "src": "assets/icon-chat.png", "sizes": "96x96" }]
    }
  ]
}
```

---

## 🔧 Service Worker (sw.js)

```javascript
const CACHE_NAME = 'ifrit-inventory-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/responsive.css',
  '/script.js',
  '/frontend/ai-chatbot.html',
  '/frontend/ai-chatbot.css',
  '/frontend/ai-chatbot.js',
  '/frontend/ai-insights.html',
  '/frontend/ai-insights.css',
  '/frontend/ai-insights.js',
  '/assets/logo-meteor.svg'
];

// Install - Cache recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch - Serve do cache primeiro
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retorna resposta
        if (response) {
          return response;
        }
        
        // Clone request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Verifica se é válido
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// Activate - Limpa cache antigo
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push Notifications (futuro)
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/assets/icon-192.png',
    badge: '/assets/badge.png',
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification('Ifrit Inventory', options)
  );
});
```

---

## 🎨 Criar Ícones PWA

### **Tamanhos Necessários**

```bash
# Gerar ícones a partir de uma imagem base
# Use: https://realfavicongenerator.net/

Tamanhos necessários:
- 192x192 (Android)
- 512x512 (Android splash)
- 180x180 (iOS)
- 152x152 (iPad)
- 120x120 (iPhone)
- 76x76 (iPad mini)
```

### **Estrutura de Assets**

```
assets/
├── icon-192.png          # Android home screen
├── icon-512.png          # Android splash screen
├── icon-180.png          # iOS home screen
├── icon-152.png          # iPad
├── icon-120.png          # iPhone
├── icon-add.png          # Shortcut: Adicionar
├── icon-chat.png         # Shortcut: Chatbot
├── badge.png             # Notification badge
├── screenshot-mobile.png # App Store screenshot
└── screenshot-desktop.png # App Store screenshot
```

---

## 📱 Como Instalar

### **Android (Chrome)**

1. Abra o site no Chrome
2. Toque no menu (⋮)
3. Selecione "Adicionar à tela inicial"
4. Confirme o nome do app
5. Ícone aparece na home screen

**Ou:**
- Banner "Instalar app" aparece automaticamente
- Toque em "Instalar"

### **iOS (Safari)**

1. Abra o site no Safari
2. Toque no botão Compartilhar (□↑)
3. Role e toque em "Adicionar à Tela de Início"
4. Edite o nome se desejar
5. Toque em "Adicionar"

### **Desktop (Chrome/Edge)**

1. Abra o site no Chrome ou Edge
2. Clique no ícone de instalação (⊕) na barra de endereço
3. Ou vá em Menu → Instalar Ifrit Inventory
4. Confirme a instalação
5. App aparece como aplicativo nativo

---

## 🔍 Verificar PWA

### **Lighthouse Audit**

```bash
# Chrome DevTools
1. F12 (DevTools)
2. Aba "Lighthouse"
3. Selecione "Progressive Web App"
4. Clique em "Generate report"

Metas:
✅ Performance: 90+
✅ Accessibility: 90+
✅ Best Practices: 90+
✅ SEO: 90+
✅ PWA: 100
```

### **PWA Checklist**

- [x] Manifest válido
- [x] Service Worker registrado
- [x] Funciona offline
- [x] HTTPS (produção)
- [x] Ícones em todos os tamanhos
- [x] Meta tags corretas
- [x] Theme color definido
- [x] Responsive
- [x] Fast (< 3s load)

---

## 🚀 Deploy PWA

### **Requisitos**

1. **HTTPS obrigatório**
   - Localhost funciona sem HTTPS
   - Produção PRECISA de HTTPS

2. **Servidor configurado**
   - MIME types corretos
   - Cache headers
   - Compression (gzip)

### **Netlify (Recomendado)**

```bash
# netlify.toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/manifest.webmanifest"
  [headers.values]
    Content-Type = "application/manifest+json"
```

### **Vercel**

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/manifest.webmanifest",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    }
  ]
}
```

---

## 🔔 Push Notifications (Futuro)

### **Backend Setup**

```javascript
// Enviar notificação
const webpush = require('web-push');

const vapidKeys = {
  publicKey: 'YOUR_PUBLIC_KEY',
  privateKey: 'YOUR_PRIVATE_KEY'
};

webpush.setVapidDetails(
  'mailto:your@email.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Enviar para subscriber
const subscription = {
  endpoint: '...',
  keys: {
    auth: '...',
    p256dh: '...'
  }
};

const payload = JSON.stringify({
  title: 'Novo item adicionado!',
  body: 'Final Fantasy VII Remake foi adicionado à sua coleção',
  icon: '/assets/icon-192.png',
  badge: '/assets/badge.png',
  data: {
    url: '/items/123'
  }
});

webpush.sendNotification(subscription, payload);
```

### **Frontend Setup**

```javascript
// Pedir permissão
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'YOUR_PUBLIC_KEY'
  });
  
  // Enviar subscription para backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });
}

// Verificar permissão
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      subscribeToPush();
    }
  });
}
```

---

## 📊 Analytics PWA

### **Eventos para Rastrear**

```javascript
// Install event
window.addEventListener('beforeinstallprompt', (e) => {
  // Track: PWA install prompt shown
  gtag('event', 'pwa_install_prompt_shown');
  
  e.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      gtag('event', 'pwa_installed');
    } else {
      gtag('event', 'pwa_install_dismissed');
    }
  });
});

// App launched
window.addEventListener('appinstalled', () => {
  gtag('event', 'pwa_app_installed');
});

// Standalone mode
if (window.matchMedia('(display-mode: standalone)').matches) {
  gtag('event', 'pwa_launched_standalone');
}

// Offline usage
window.addEventListener('offline', () => {
  gtag('event', 'pwa_offline');
});

window.addEventListener('online', () => {
  gtag('event', 'pwa_online');
});
```

---

## 🎯 Otimizações PWA

### **1. App Shell Pattern**

```javascript
// Cache app shell primeiro
const APP_SHELL = [
  '/',
  '/styles.css',
  '/responsive.css',
  '/script.js',
  '/assets/logo-meteor.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('app-shell-v1')
      .then(cache => cache.addAll(APP_SHELL))
  );
});
```

### **2. Background Sync**

```javascript
// Sincronizar quando voltar online
self.addEventListener('sync', event => {
  if (event.tag === 'sync-items') {
    event.waitUntil(syncItems());
  }
});

async function syncItems() {
  const items = await getUnsyncedItems();
  
  for (const item of items) {
    await fetch('/api/items', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }
}
```

### **3. Precaching**

```javascript
// Precache recursos importantes
const PRECACHE_URLS = [
  '/frontend/ai-chatbot.html',
  '/frontend/ai-insights.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'
];
```

---

## 🔒 Segurança PWA

### **Content Security Policy**

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; 
               style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; 
               img-src 'self' data: https:; 
               connect-src 'self' http://localhost:3000;">
```

### **Permissions Policy**

```html
<meta http-equiv="Permissions-Policy" 
      content="camera=(), microphone=(self), geolocation=()">
```

---

## 📱 App Store Submission (Futuro)

### **PWABuilder**

1. Acesse: https://www.pwabuilder.com/
2. Insira URL do seu PWA
3. Gere pacotes para:
   - Google Play Store (Android)
   - Microsoft Store (Windows)
   - App Store (iOS via wrapper)

### **Trusted Web Activity (Android)**

```bash
# Gerar APK do PWA
npx @bubblewrap/cli init --manifest https://seu-site.com/manifest.webmanifest
npx @bubblewrap/cli build
```

---

## ✅ Checklist Final

- [x] Manifest configurado
- [x] Service Worker registrado
- [x] Ícones em todos os tamanhos
- [x] Meta tags PWA
- [x] Funciona offline
- [x] HTTPS em produção
- [x] Lighthouse score 90+
- [x] Instalável em todos os dispositivos
- [x] App shortcuts configurados
- [x] Theme color definido

---

**🔥 Seu Ifrit Inventory agora é um PWA completo e instalável!**

Usuários podem instalar como app nativo e usar offline!
