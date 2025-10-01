# Sistema de Acesso Granular - Ifrit Inventory

## 📋 Visão Geral

O Sistema de Acesso Granular foi implementado no Ifrit Inventory para fornecer controle detalhado sobre quem pode acessar e modificar diferentes partes do sistema. Este sistema inclui autenticação de usuários, controle de permissões baseado em roles e auditoria de atividades.

## 🔐 Funcionalidades Implementadas

### 1. Sistema de Autenticação
- **Login/Logout seguro**
- **Sessões persistentes**
- **Validação de credenciais**
- **Interface de login responsiva**

### 2. Sistema de Roles e Permissões
- **4 níveis de acesso diferentes**
- **Permissões granulares para cada ação**
- **Controle baseado em propriedade de itens**

### 3. Gerenciamento de Usuários
- **Interface administrativa completa**
- **Criação, edição e exclusão de usuários**
- **Controle de status (ativo/inativo)**
- **Exportação de dados de usuários**

### 4. Auditoria e Monitoramento
- **Log de todas as atividades**
- **Histórico por usuário**
- **Rastreamento de mudanças**

## 👥 Roles e Permissões

### 🔴 Administrador (ADMIN)
**Acesso completo ao sistema**
- ✅ Todas as permissões
- ✅ Gerenciar usuários e roles
- ✅ Resetar banco de dados
- ✅ Ver atividades de todos os usuários
- ✅ Operações em lote
- ✅ Filtros avançados

### 🟢 Editor (EDITOR)
**Pode criar e editar itens**
- ✅ Visualizar todos os dados
- ✅ Criar novos itens
- ✅ Editar qualquer item
- ✅ Excluir próprios itens
- ✅ Importar/Exportar dados
- ✅ Operações em lote
- ✅ Filtros avançados
- ❌ Gerenciar usuários
- ❌ Resetar banco de dados

### 🔵 Colaborador (CONTRIBUTOR)
**Pode adicionar itens e editar próprios**
- ✅ Visualizar todos os dados
- ✅ Criar novos itens (com aprovação)
- ✅ Editar próprios itens
- ✅ Excluir próprios itens
- ✅ Exportar dados
- ⏳ Itens novos precisam de aprovação do admin
- ❌ Editar itens de outros
- ❌ Importar dados
- ❌ Gerenciar usuários

### ⚪ Visualizador (VIEWER)
**Apenas visualização**
- ✅ Visualizar itens, estatísticas, conquistas
- ✅ Exportar dados
- ❌ Criar, editar ou excluir itens
- ❌ Importar dados
- ❌ Gerenciar usuários

## 🚀 Como Usar

### Primeiro Acesso (Administrador)
1. **Abra o site** - O sistema mostrará automaticamente a tela de login
2. **Use as credenciais padrão:**
   - **Usuário:** `admin`
   - **Senha:** `admin123`
3. **Faça login** e você terá acesso completo como administrador

### Registro Público (Novos Usuários)
1. **Abra o site** - Na tela de login, clique em "Criar Nova Conta"
2. **Preencha o formulário:**
   - Nome de usuário (único)
   - Email (único)
   - Nome de exibição
   - Senha (mínimo 6 caracteres)
3. **Aceite os termos** e clique em "Criar Conta"
4. **Login automático** - Você entrará automaticamente como **Colaborador**
5. **Seus itens precisarão de aprovação** antes de aparecerem no sistema

### Gerenciamento de Usuários
1. **Acesse o gerenciamento** - Clique no ícone de usuários no header (👥)
2. **Criar novo usuário:**
   - Clique em "Novo Usuário"
   - Preencha os dados obrigatórios
   - Selecione o role apropriado
   - Clique em "Criar Usuário"
3. **Editar usuário existente:**
   - Clique no ícone de edição (✏️) na linha do usuário
   - Modifique os dados necessários
   - Clique em "Salvar Alterações"

### Sistema de Aprovação (Administradores)
1. **Acesse as aprovações** - Clique no ícone de tarefas no header (📋)
2. **Revise itens pendentes:**
   - Veja detalhes completos do item
   - Identifique quem enviou e quando
   - Aprove, rejeite ou edite antes de aprovar
3. **Gerencie notificações:**
   - Veja novos usuários registrados
   - Marque notificações como lidas
   - Limpe notificações antigas

### Controle de Permissões
- **Elementos da interface** são automaticamente ocultados baseado nas permissões
- **Ações são bloqueadas** se o usuário não tiver permissão
- **Notificações** informam quando uma ação é negada
- **Indicadores visuais** mostram quem criou cada item
- **Itens pendentes** aparecem com status especial para colaboradores

## 🔧 Estrutura Técnica

### Arquivos Principais
```
auth.js                 # Sistema de autenticação principal
auth.css               # Estilos para autenticação
user-management.js     # Interface de gerenciamento de usuários
user-management.css    # Estilos para gerenciamento
public-registration.js # Sistema de registro público
public-registration.css# Estilos para registro
item-approval.js       # Interface de aprovação de itens
item-approval.css      # Estilos para aprovação
auth-integration.js    # Integração com sistema existente
```

### Permissões Disponíveis
```javascript
VIEW_ITEMS              # Visualizar itens
VIEW_STATS              # Visualizar estatísticas
VIEW_ACHIEVEMENTS       # Visualizar conquistas
VIEW_LOTTERY            # Visualizar loterias
CREATE_ITEMS            # Criar novos itens
CREATE_CATEGORIES       # Criar categorias
EDIT_ITEMS              # Editar qualquer item
EDIT_OWN_ITEMS          # Editar próprios itens
EDIT_CATEGORIES         # Editar categorias
DELETE_ITEMS            # Excluir qualquer item
DELETE_OWN_ITEMS        # Excluir próprios itens
DELETE_CATEGORIES       # Excluir categorias
EXPORT_DATA             # Exportar dados
IMPORT_DATA             # Importar dados
MANAGE_USERS            # Gerenciar usuários
MANAGE_ROLES            # Gerenciar roles
RESET_DATABASE          # Resetar banco de dados
VIEW_USER_ACTIVITY      # Ver atividade de usuários
BULK_OPERATIONS         # Operações em lote
ADVANCED_FILTERS        # Filtros avançados
```

## 💾 Armazenamento de Dados

### LocalStorage
- **`ifrit_users`** - Dados dos usuários
- **`ifrit_user_activities`** - Log de atividades
- **`ifrit_pending_items`** - Itens aguardando aprovação
- **`ifrit_admin_notifications`** - Notificações para administradores

### SessionStorage
- **`ifrit_current_user`** - Usuário atual da sessão

## 🔒 Segurança

### Medidas Implementadas
- **Hash de senhas** (implementação básica para demonstração)
- **Validação de sessão** a cada operação
- **Controle de acesso** em todas as funções críticas
- **Log de auditoria** para todas as ações
- **Validação de propriedade** para operações em itens próprios

### Recomendações para Produção
- Implementar hash de senhas mais robusto (bcrypt)
- Adicionar autenticação de dois fatores
- Implementar rate limiting
- Usar HTTPS obrigatório
- Adicionar validação de entrada mais rigorosa
- Implementar backup automático dos logs

## 🎨 Interface do Usuário

### Indicadores Visuais
- **Badge "Você"** - Identifica o usuário atual na lista
- **Indicadores de role** - Cores diferentes para cada nível
- **Badge "Seu item"** - Mostra itens criados pelo usuário atual
- **Botões de ação** - Aparecem apenas se o usuário tiver permissão
- **Status online/offline** - Indica status dos usuários

### Notificações
- **Permissão negada** - Alerta quando uma ação é bloqueada
- **Sucesso** - Confirma quando operações são realizadas
- **Erros** - Informa sobre problemas durante operações

## 📊 Monitoramento e Auditoria

### Log de Atividades
Todas as ações são registradas com:
- **ID do usuário** que realizou a ação
- **Tipo de ação** (login, logout, create_item, etc.)
- **Descrição detalhada** da ação
- **Timestamp** preciso
- **IP do usuário** (localhost para desenvolvimento)

### Relatórios Disponíveis
- **Atividade por usuário** - Histórico completo de um usuário
- **Estatísticas de uso** - Quantos usuários, itens por usuário, etc.
- **Exportação de dados** - Backup completo dos usuários

## 🔄 Fluxo de Trabalho Típico

### Para Administradores
1. Fazer login como admin
2. Criar usuários para a equipe
3. Definir roles apropriados
4. Monitorar atividades
5. Fazer backup dos dados

### Para Editores
1. Fazer login com credenciais
2. Adicionar novos itens à coleção
3. Editar informações de itens existentes
4. Exportar dados quando necessário

### Para Colaboradores
1. Fazer login com credenciais
2. Adicionar itens próprios
3. Editar apenas itens que criaram
4. Visualizar estatísticas gerais

### Para Visualizadores
1. Fazer login com credenciais
2. Navegar pela coleção
3. Ver estatísticas e conquistas
4. Exportar dados se necessário

## 🛠️ Personalização

### Adicionando Novas Permissões
1. Defina a nova permissão em `definePermissions()`
2. Adicione aos roles apropriados em `defineRoles()`
3. Implemente a verificação onde necessário
4. Atualize a interface conforme a permissão

### Criando Novos Roles
1. Adicione o novo role em `defineRoles()`
2. Defina as permissões apropriadas
3. Atualize as interfaces de seleção
4. Teste todas as funcionalidades

## 📞 Suporte e Manutenção

### Problemas Comuns
- **Esqueci a senha do admin:** Use as credenciais padrão `admin/admin123`
- **Usuário não consegue fazer login:** Verifique se está ativo
- **Permissões não funcionam:** Verifique se o role está correto
- **Interface não atualiza:** Recarregue a página

### Backup e Restauração
- **Backup manual:** Use a função de exportar usuários
- **Restauração:** Importe o arquivo JSON de usuários
- **Reset completo:** Use a função de reset (apenas admins)

---

## 🎯 Conclusão

O Sistema de Acesso Granular do Ifrit Inventory fornece uma solução completa para controle de acesso em aplicações web. Com 4 níveis de usuário, mais de 15 permissões granulares e uma interface administrativa completa, o sistema atende desde pequenas equipes até organizações maiores que precisam de controle detalhado sobre quem pode acessar e modificar dados.

O sistema foi projetado para ser seguro, flexível e fácil de usar, mantendo a experiência do usuário fluida enquanto garante que apenas usuários autorizados possam realizar ações específicas.

**Versão:** 1.0  
**Data:** 2025-01-23  
**Autor:** Sistema Ifrit Inventory
