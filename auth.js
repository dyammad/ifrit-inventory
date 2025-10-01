// Sistema de Autenticação e Controle de Acesso Granular
// Ifrit Inventory - Final Fantasy Collection

class AuthSystem {
  constructor() {
    this.currentUser = null;
    this.users = this.loadUsers();
    this.permissions = this.definePermissions();
    this.roles = this.defineRoles();
    this.init();
  }

  // Definir permissões granulares
  definePermissions() {
    return {
      // Permissões de visualização
      VIEW_ITEMS: 'view_items',
      VIEW_STATS: 'view_stats',
      VIEW_ACHIEVEMENTS: 'view_achievements',
      VIEW_LOTTERY: 'view_lottery',
      
      // Permissões de criação
      CREATE_ITEMS: 'create_items',
      CREATE_CATEGORIES: 'create_categories',
      
      // Permissões de edição
      EDIT_ITEMS: 'edit_items',
      EDIT_OWN_ITEMS: 'edit_own_items',
      EDIT_CATEGORIES: 'edit_categories',
      
      // Permissões de exclusão
      DELETE_ITEMS: 'delete_items',
      DELETE_OWN_ITEMS: 'delete_own_items',
      DELETE_CATEGORIES: 'delete_categories',
      
      // Permissões de importação/exportação
      EXPORT_DATA: 'export_data',
      IMPORT_DATA: 'import_data',
      
      // Permissões administrativas
      MANAGE_USERS: 'manage_users',
      MANAGE_ROLES: 'manage_roles',
      RESET_DATABASE: 'reset_database',
      VIEW_USER_ACTIVITY: 'view_user_activity',
      
      // Permissões especiais
      BULK_OPERATIONS: 'bulk_operations',
      ADVANCED_FILTERS: 'advanced_filters'
    };
  }

  // Definir roles com suas permissões
  defineRoles() {
    const p = this.permissions;
    return {
      ADMIN: {
        name: 'Administrador',
        description: 'Acesso completo ao sistema',
        permissions: Object.values(p),
        color: '#ff4d2e'
      },
      EDITOR: {
        name: 'Editor',
        description: 'Pode criar e editar itens',
        permissions: [
          p.VIEW_ITEMS, p.VIEW_STATS, p.VIEW_ACHIEVEMENTS, p.VIEW_LOTTERY,
          p.CREATE_ITEMS, p.EDIT_ITEMS, p.DELETE_OWN_ITEMS,
          p.EXPORT_DATA, p.IMPORT_DATA, p.BULK_OPERATIONS, p.ADVANCED_FILTERS
        ],
        color: '#4CAF50'
      },
      CONTRIBUTOR: {
        name: 'Colaborador',
        description: 'Pode adicionar itens e editar próprios',
        permissions: [
          p.VIEW_ITEMS, p.VIEW_STATS, p.VIEW_ACHIEVEMENTS, p.VIEW_LOTTERY,
          p.CREATE_ITEMS, p.EDIT_OWN_ITEMS, p.DELETE_OWN_ITEMS,
          p.EXPORT_DATA
        ],
        color: '#2196F3'
      },
      VIEWER: {
        name: 'Visualizador',
        description: 'Apenas visualização',
        permissions: [
          p.VIEW_ITEMS, p.VIEW_STATS, p.VIEW_ACHIEVEMENTS, p.VIEW_LOTTERY,
          p.EXPORT_DATA
        ],
        color: '#9E9E9E'
      }
    };
  }

  // Carregar usuários do localStorage
  loadUsers() {
    const stored = localStorage.getItem('ifrit_users');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Criar usuário admin padrão
    const defaultUsers = {
      'admin': {
        id: 'admin',
        username: 'admin',
        email: 'admin@ifrit-inventory.com',
        password: this.hashPassword('admin123'), // Senha padrão
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        active: true,
        profile: {
          displayName: 'Administrador',
          avatar: null,
          preferences: {
            theme: 'dark',
            language: 'pt-BR'
          }
        }
      }
    };
    
    this.saveUsers(defaultUsers);
    return defaultUsers;
  }

  // Salvar usuários no localStorage
  saveUsers(users = this.users) {
    localStorage.setItem('ifrit_users', JSON.stringify(users));
    this.users = users;
  }

  // Hash simples para senhas (em produção, use bcrypt ou similar)
  hashPassword(password) {
    // Implementação simples para demonstração
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  // Inicializar sistema
  init() {
    this.loadCurrentUser();
    this.createLoginInterface();
    this.bindEvents();
  }

  // Carregar usuário atual da sessão
  loadCurrentUser() {
    const stored = sessionStorage.getItem('ifrit_current_user');
    if (stored) {
      const userData = JSON.parse(stored);
      if (this.users[userData.id] && this.users[userData.id].active) {
        this.currentUser = userData;
        this.showAuthenticatedInterface();
      }
    }
  }

  // Fazer login
  async login(username, password) {
    const user = Object.values(this.users).find(u => 
      (u.username === username || u.email === username) && u.active
    );

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.password !== this.hashPassword(password)) {
      throw new Error('Senha incorreta');
    }

    // Atualizar último login
    user.lastLogin = new Date().toISOString();
    this.saveUsers();

    // Definir usuário atual
    this.currentUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile
    };

    // Salvar na sessão
    sessionStorage.setItem('ifrit_current_user', JSON.stringify(this.currentUser));
    
    this.showAuthenticatedInterface();
    this.logActivity('login', 'Usuário fez login');
    
    return this.currentUser;
  }

  // Fazer logout
  logout() {
    if (this.currentUser) {
      this.logActivity('logout', 'Usuário fez logout');
    }
    
    this.currentUser = null;
    sessionStorage.removeItem('ifrit_current_user');
    this.showLoginInterface();
  }

  // Verificar se usuário tem permissão
  hasPermission(permission) {
    if (!this.currentUser) return false;
    
    const userRole = this.roles[this.currentUser.role];
    if (!userRole) return false;
    
    return userRole.permissions.includes(permission);
  }

  // Verificar múltiplas permissões (OR)
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Verificar múltiplas permissões (AND)
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Verificar se é proprietário do item
  isOwner(item) {
    if (!this.currentUser || !item.createdBy) return false;
    return item.createdBy === this.currentUser.id;
  }

  // Criar interface de login
  createLoginInterface() {
    if (document.getElementById('loginModal')) return;

    const loginHTML = `
      <div id="loginModal" class="modal auth-modal" aria-hidden="false">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3><i class="fa-solid fa-shield-halved"></i> Acesso ao Sistema</h3>
          </div>
          <form id="loginForm" class="modal-body">
            <div class="auth-logo">
              <img src="assets/logo-meteor.svg" alt="Ifrit Inventory" width="64" height="64" />
              <h2>Ifrit Inventory</h2>
              <p>Sistema de Controle de Acesso</p>
            </div>
            
            <div class="form-group">
              <label>
                <i class="fa-solid fa-user"></i>
                <span>Usuário ou Email</span>
                <input type="text" name="username" required autocomplete="username" />
              </label>
            </div>
            
            <div class="form-group">
              <label>
                <i class="fa-solid fa-lock"></i>
                <span>Senha</span>
                <input type="password" name="password" required autocomplete="current-password" />
              </label>
            </div>
            
            <div id="loginError" class="error-message" hidden></div>
            
            <div class="modal-footer">
              <button type="submit" class="btn primary full-width">
                <i class="fa-solid fa-sign-in-alt"></i> Entrar
              </button>
            </div>
            
            <div class="auth-help">
              <p><strong>Usuário padrão:</strong> admin</p>
              <p><strong>Senha padrão:</strong> admin123</p>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', loginHTML);
  }

  // Mostrar interface de login
  showLoginInterface() {
    const loginModal = document.getElementById('loginModal');
    const mainContent = document.querySelector('.layout');
    const header = document.querySelector('.topbar');
    
    if (loginModal) {
      loginModal.hidden = false;
      loginModal.setAttribute('aria-hidden', 'false');
    }
    
    if (mainContent) mainContent.style.display = 'none';
    if (header) header.style.display = 'none';
  }

  // Mostrar interface autenticada
  showAuthenticatedInterface() {
    const loginModal = document.getElementById('loginModal');
    const mainContent = document.querySelector('.layout');
    const header = document.querySelector('.topbar');
    
    if (loginModal) {
      loginModal.hidden = true;
      loginModal.setAttribute('aria-hidden', 'true');
    }
    
    if (mainContent) mainContent.style.display = 'flex';
    if (header) header.style.display = 'flex';
    
    this.updateUIForUser();
  }

  // Atualizar UI baseada nas permissões do usuário
  updateUIForUser() {
    if (!this.currentUser) return;

    // Adicionar informações do usuário no header
    this.addUserInfoToHeader();
    
    // Controlar visibilidade de elementos baseado em permissões
    this.controlElementVisibility();
    
    // Atualizar botões e ações
    this.updateActionButtons();
  }

  // Adicionar informações do usuário no header
  addUserInfoToHeader() {
    const header = document.querySelector('.topbar .actions');
    if (!header) return;

    // Remover info anterior se existir
    const existingUserInfo = document.getElementById('userInfo');
    if (existingUserInfo) existingUserInfo.remove();

    const userRole = this.roles[this.currentUser.role];
    const userInfoHTML = `
      <div id="userInfo" class="user-info">
        <div class="user-details">
          <span class="user-name">${this.currentUser.profile.displayName}</span>
          <span class="user-role" style="color: ${userRole.color}">${userRole.name}</span>
        </div>
        <div class="user-actions">
          ${this.hasPermission(this.permissions.MANAGE_USERS) ? 
            '<button id="userManagementBtn" class="btn secondary"><i class="fa-solid fa-users"></i></button>' : ''}
          <button id="userProfileBtn" class="btn secondary"><i class="fa-solid fa-user-circle"></i></button>
          <button id="logoutBtn" class="btn secondary"><i class="fa-solid fa-sign-out-alt"></i></button>
        </div>
      </div>
    `;

    header.insertAdjacentHTML('beforeend', userInfoHTML);
  }

  // Controlar visibilidade de elementos
  controlElementVisibility() {
    const elements = [
      { selector: '#addItemBtn', permission: this.permissions.CREATE_ITEMS },
      { selector: '#resetDbBtn', permission: this.permissions.RESET_DATABASE },
      { selector: '#importInput', permission: this.permissions.IMPORT_DATA },
      { selector: '#pasteImportBtn', permission: this.permissions.IMPORT_DATA },
      { selector: '#exportBtn', permission: this.permissions.EXPORT_DATA }
    ];

    elements.forEach(({ selector, permission }) => {
      const element = document.querySelector(selector);
      if (element) {
        if (this.hasPermission(permission)) {
          element.style.display = '';
          element.disabled = false;
        } else {
          element.style.display = 'none';
          element.disabled = true;
        }
      }
    });
  }

  // Atualizar botões de ação
  updateActionButtons() {
    // Será implementado quando os botões de edição/exclusão forem criados
  }

  // Vincular eventos
  bindEvents() {
    // Login form
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'loginForm') {
        e.preventDefault();
        this.handleLogin(e.target);
      }
    });

    // Logout button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
        this.logout();
      }
    });

    // User management button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'userManagementBtn' || e.target.closest('#userManagementBtn')) {
        this.showUserManagement();
      }
    });

    // User profile button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'userProfileBtn' || e.target.closest('#userProfileBtn')) {
        this.showUserProfile();
      }
    });
  }

  // Manipular login
  async handleLogin(form) {
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');
    const errorDiv = document.getElementById('loginError');
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
      errorDiv.hidden = true;

      await this.login(username, password);
      
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-sign-in-alt"></i> Entrar';
    }
  }

  // Registrar atividade do usuário
  logActivity(action, description) {
    if (!this.currentUser) return;

    const activities = JSON.parse(localStorage.getItem('ifrit_user_activities') || '[]');
    activities.push({
      id: Date.now().toString(),
      userId: this.currentUser.id,
      username: this.currentUser.username,
      action,
      description,
      timestamp: new Date().toISOString(),
      ip: 'localhost' // Em produção, capturar IP real
    });

    // Manter apenas os últimos 1000 registros
    if (activities.length > 1000) {
      activities.splice(0, activities.length - 1000);
    }

    localStorage.setItem('ifrit_user_activities', JSON.stringify(activities));
  }

  // Mostrar gerenciamento de usuários
  showUserManagement() {
    if (!this.hasPermission(this.permissions.MANAGE_USERS)) {
      alert('Você não tem permissão para gerenciar usuários.');
      return;
    }
    
    // Implementar interface de gerenciamento de usuários
    console.log('Abrindo gerenciamento de usuários...');
  }

  // Mostrar perfil do usuário
  showUserProfile() {
    // Implementar interface de perfil do usuário
    console.log('Abrindo perfil do usuário...');
  }

  // Métodos públicos para integração
  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  getUserRole() {
    return this.currentUser ? this.currentUser.role : null;
  }

  getRoleInfo(roleName = null) {
    const role = roleName || this.getUserRole();
    return role ? this.roles[role] : null;
  }
}

// Instância global do sistema de autenticação
window.authSystem = new AuthSystem();
