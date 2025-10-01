// Sistema de Gerenciamento de Usuários
// Ifrit Inventory - Final Fantasy Collection

class UserManagement {
  constructor(authSystem) {
    this.auth = authSystem;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  // Mostrar interface de gerenciamento de usuários
  show() {
    if (!this.auth.hasPermission(this.auth.permissions.MANAGE_USERS)) {
      this.showAccessDenied();
      return;
    }

    this.createUserManagementModal();
    this.loadUsers();
  }

  // Criar modal de gerenciamento de usuários
  createUserManagementModal() {
    // Remover modal existente se houver
    const existingModal = document.getElementById('userManagementModal');
    if (existingModal) existingModal.remove();

    const modalHTML = `
      <div id="userManagementModal" class="modal user-management-modal" aria-hidden="false">
        <div class="modal-dialog large">
          <div class="modal-header">
            <h3><i class="fa-solid fa-users"></i> Gerenciamento de Usuários</h3>
            <button type="button" class="icon-btn" id="closeUserManagementModal" aria-label="Fechar">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="user-management-toolbar">
              <div class="search-section">
                <input type="search" id="userSearchInput" placeholder="Buscar usuários..." />
                <select id="roleFilterSelect">
                  <option value="">Todos os roles</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="EDITOR">Editor</option>
                  <option value="CONTRIBUTOR">Colaborador</option>
                  <option value="VIEWER">Visualizador</option>
                </select>
              </div>
              
              <div class="action-section">
                <button id="addUserBtn" class="btn primary">
                  <i class="fa-solid fa-user-plus"></i> Novo Usuário
                </button>
                <button id="exportUsersBtn" class="btn secondary">
                  <i class="fa-solid fa-download"></i> Exportar
                </button>
              </div>
            </div>

            <div class="users-table-container">
              <table id="usersTable" class="users-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Último Login</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody id="usersTableBody">
                  <!-- Usuários serão carregados aqui -->
                </tbody>
              </table>
            </div>

            <div class="user-stats">
              <div class="stat-card">
                <div class="stat-value" id="totalUsersCount">0</div>
                <div class="stat-label">Total de Usuários</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" id="activeUsersCount">0</div>
                <div class="stat-label">Usuários Ativos</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" id="adminUsersCount">0</div>
                <div class="stat-label">Administradores</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // Carregar e exibir usuários
  loadUsers() {
    const users = Object.values(this.auth.users);
    const tbody = document.getElementById('usersTableBody');
    const searchTerm = document.getElementById('userSearchInput')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('roleFilterSelect')?.value || '';

    // Filtrar usuários
    const filteredUsers = users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.profile.displayName.toLowerCase().includes(searchTerm);
      
      const matchesRole = !roleFilter || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });

    // Limpar tabela
    tbody.innerHTML = '';

    // Adicionar usuários à tabela
    filteredUsers.forEach(user => {
      const row = this.createUserRow(user);
      tbody.appendChild(row);
    });

    // Atualizar estatísticas
    this.updateUserStats(users);
  }

  // Criar linha da tabela para usuário
  createUserRow(user) {
    const row = document.createElement('tr');
    const roleInfo = this.auth.roles[user.role];
    const isCurrentUser = this.auth.currentUser.id === user.id;
    
    row.innerHTML = `
      <td>
        <div class="user-info-cell">
          <div class="user-avatar">
            ${user.profile.avatar ? 
              `<img src="${user.profile.avatar}" alt="${user.profile.displayName}" />` :
              `<i class="fa-solid fa-user"></i>`
            }
          </div>
          <div class="user-details">
            <div class="user-name">
              ${user.profile.displayName}
              ${isCurrentUser ? '<span class="current-user-badge">Você</span>' : ''}
            </div>
            <div class="username">@${user.username}</div>
          </div>
        </div>
      </td>
      <td>${user.email}</td>
      <td>
        <span class="role-indicator ${user.role.toLowerCase()}" style="background-color: ${roleInfo.color}20; color: ${roleInfo.color}; border-color: ${roleInfo.color}">
          ${roleInfo.name}
        </span>
      </td>
      <td>
        <span class="status-indicator ${user.active ? 'online' : 'offline'}"></span>
        ${user.active ? 'Ativo' : 'Inativo'}
      </td>
      <td>${user.lastLogin ? this.formatDate(user.lastLogin) : 'Nunca'}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon edit-user" data-user-id="${user.id}" title="Editar usuário">
            <i class="fa-solid fa-edit"></i>
          </button>
          <button class="btn-icon view-activity" data-user-id="${user.id}" title="Ver atividade">
            <i class="fa-solid fa-history"></i>
          </button>
          ${!isCurrentUser ? `
            <button class="btn-icon toggle-status" data-user-id="${user.id}" title="${user.active ? 'Desativar' : 'Ativar'} usuário">
              <i class="fa-solid fa-${user.active ? 'ban' : 'check'}"></i>
            </button>
            <button class="btn-icon delete-user" data-user-id="${user.id}" title="Excluir usuário">
              <i class="fa-solid fa-trash"></i>
            </button>
          ` : ''}
        </div>
      </td>
    `;

    return row;
  }

  // Atualizar estatísticas de usuários
  updateUserStats(users) {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.active).length;
    const adminUsers = users.filter(u => u.role === 'ADMIN').length;

    document.getElementById('totalUsersCount').textContent = totalUsers;
    document.getElementById('activeUsersCount').textContent = activeUsers;
    document.getElementById('adminUsersCount').textContent = adminUsers;
  }

  // Mostrar formulário de novo usuário
  showAddUserForm() {
    const formHTML = `
      <div id="addUserModal" class="modal" aria-hidden="false">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3><i class="fa-solid fa-user-plus"></i> Novo Usuário</h3>
            <button type="button" class="icon-btn" id="closeAddUserModal" aria-label="Fechar">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <form id="addUserForm" class="modal-body">
            <div class="form-grid">
              <label>
                <span>Nome de Usuário</span>
                <input type="text" name="username" required pattern="[a-zA-Z0-9_]+" 
                       title="Apenas letras, números e underscore" />
              </label>
              
              <label>
                <span>Email</span>
                <input type="email" name="email" required />
              </label>
              
              <label>
                <span>Nome de Exibição</span>
                <input type="text" name="displayName" required />
              </label>
              
              <label>
                <span>Role</span>
                <select name="role" required>
                  <option value="">Selecione um role</option>
                  <option value="VIEWER">Visualizador</option>
                  <option value="CONTRIBUTOR">Colaborador</option>
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>
              
              <label>
                <span>Senha</span>
                <input type="password" name="password" required minlength="6" />
              </label>
              
              <label>
                <span>Confirmar Senha</span>
                <input type="password" name="confirmPassword" required minlength="6" />
              </label>
            </div>
            
            <label class="checkbox-label">
              <input type="checkbox" name="active" checked />
              <span>Usuário ativo</span>
            </label>
            
            <div id="addUserError" class="error-message" hidden></div>
            
            <div class="modal-footer">
              <button type="button" class="btn" id="cancelAddUser">Cancelar</button>
              <button type="submit" class="btn primary">Criar Usuário</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', formHTML);
  }

  // Mostrar formulário de edição de usuário
  showEditUserForm(userId) {
    const user = this.auth.users[userId];
    if (!user) return;

    const formHTML = `
      <div id="editUserModal" class="modal" aria-hidden="false">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3><i class="fa-solid fa-user-edit"></i> Editar Usuário</h3>
            <button type="button" class="icon-btn" id="closeEditUserModal" aria-label="Fechar">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <form id="editUserForm" class="modal-body" data-user-id="${userId}">
            <div class="form-grid">
              <label>
                <span>Nome de Usuário</span>
                <input type="text" name="username" value="${user.username}" required pattern="[a-zA-Z0-9_]+" 
                       title="Apenas letras, números e underscore" />
              </label>
              
              <label>
                <span>Email</span>
                <input type="email" name="email" value="${user.email}" required />
              </label>
              
              <label>
                <span>Nome de Exibição</span>
                <input type="text" name="displayName" value="${user.profile.displayName}" required />
              </label>
              
              <label>
                <span>Role</span>
                <select name="role" required>
                  <option value="VIEWER" ${user.role === 'VIEWER' ? 'selected' : ''}>Visualizador</option>
                  <option value="CONTRIBUTOR" ${user.role === 'CONTRIBUTOR' ? 'selected' : ''}>Colaborador</option>
                  <option value="EDITOR" ${user.role === 'EDITOR' ? 'selected' : ''}>Editor</option>
                  <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>Administrador</option>
                </select>
              </label>
              
              <label>
                <span>Nova Senha (deixe em branco para manter)</span>
                <input type="password" name="password" minlength="6" />
              </label>
              
              <label>
                <span>Confirmar Nova Senha</span>
                <input type="password" name="confirmPassword" minlength="6" />
              </label>
            </div>
            
            <label class="checkbox-label">
              <input type="checkbox" name="active" ${user.active ? 'checked' : ''} />
              <span>Usuário ativo</span>
            </label>
            
            <div id="editUserError" class="error-message" hidden></div>
            
            <div class="modal-footer">
              <button type="button" class="btn" id="cancelEditUser">Cancelar</button>
              <button type="submit" class="btn primary">Salvar Alterações</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', formHTML);
  }

  // Mostrar atividade do usuário
  showUserActivity(userId) {
    const activities = JSON.parse(localStorage.getItem('ifrit_user_activities') || '[]')
      .filter(activity => activity.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50); // Últimas 50 atividades

    const user = this.auth.users[userId];
    
    const modalHTML = `
      <div id="userActivityModal" class="modal" aria-hidden="false">
        <div class="modal-dialog large">
          <div class="modal-header">
            <h3><i class="fa-solid fa-history"></i> Atividade de ${user.profile.displayName}</h3>
            <button type="button" class="icon-btn" id="closeUserActivityModal" aria-label="Fechar">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="activity-list">
              ${activities.length > 0 ? activities.map(activity => `
                <div class="activity-item">
                  <div class="activity-icon">
                    <i class="fa-solid fa-${this.getActivityIcon(activity.action)}"></i>
                  </div>
                  <div class="activity-details">
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-meta">
                      ${this.formatDate(activity.timestamp)} • ${activity.action}
                    </div>
                  </div>
                </div>
              `).join('') : '<p class="no-activity">Nenhuma atividade registrada.</p>'}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // Obter ícone para tipo de atividade
  getActivityIcon(action) {
    const icons = {
      'login': 'sign-in-alt',
      'logout': 'sign-out-alt',
      'create_item': 'plus',
      'edit_item': 'edit',
      'delete_item': 'trash',
      'export_data': 'download',
      'import_data': 'upload',
      'user_created': 'user-plus',
      'user_updated': 'user-edit',
      'user_deleted': 'user-minus'
    };
    return icons[action] || 'circle';
  }

  // Criar novo usuário
  async createUser(formData) {
    const username = formData.get('username');
    const email = formData.get('email');
    const displayName = formData.get('displayName');
    const role = formData.get('role');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const active = formData.get('active') === 'on';

    // Validações
    if (password !== confirmPassword) {
      throw new Error('As senhas não coincidem');
    }

    if (Object.values(this.auth.users).some(u => u.username === username)) {
      throw new Error('Nome de usuário já existe');
    }

    if (Object.values(this.auth.users).some(u => u.email === email)) {
      throw new Error('Email já está em uso');
    }

    // Criar usuário
    const userId = Date.now().toString();
    const newUser = {
      id: userId,
      username,
      email,
      password: this.auth.hashPassword(password),
      role,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      active,
      profile: {
        displayName,
        avatar: null,
        preferences: {
          theme: 'dark',
          language: 'pt-BR'
        }
      }
    };

    // Salvar usuário
    this.auth.users[userId] = newUser;
    this.auth.saveUsers();

    // Registrar atividade
    this.auth.logActivity('user_created', `Usuário ${username} foi criado`);

    return newUser;
  }

  // Atualizar usuário
  async updateUser(userId, formData) {
    const user = this.auth.users[userId];
    if (!user) throw new Error('Usuário não encontrado');

    const username = formData.get('username');
    const email = formData.get('email');
    const displayName = formData.get('displayName');
    const role = formData.get('role');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const active = formData.get('active') === 'on';

    // Validações
    if (password && password !== confirmPassword) {
      throw new Error('As senhas não coincidem');
    }

    if (username !== user.username && Object.values(this.auth.users).some(u => u.username === username)) {
      throw new Error('Nome de usuário já existe');
    }

    if (email !== user.email && Object.values(this.auth.users).some(u => u.email === email)) {
      throw new Error('Email já está em uso');
    }

    // Atualizar usuário
    user.username = username;
    user.email = email;
    user.role = role;
    user.active = active;
    user.profile.displayName = displayName;

    if (password) {
      user.password = this.auth.hashPassword(password);
    }

    // Salvar alterações
    this.auth.saveUsers();

    // Registrar atividade
    this.auth.logActivity('user_updated', `Usuário ${username} foi atualizado`);

    return user;
  }

  // Excluir usuário
  async deleteUser(userId) {
    const user = this.auth.users[userId];
    if (!user) throw new Error('Usuário não encontrado');

    if (userId === this.auth.currentUser.id) {
      throw new Error('Você não pode excluir sua própria conta');
    }

    // Confirmar exclusão
    const confirmed = confirm(`Tem certeza que deseja excluir o usuário "${user.profile.displayName}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    // Excluir usuário
    delete this.auth.users[userId];
    this.auth.saveUsers();

    // Registrar atividade
    this.auth.logActivity('user_deleted', `Usuário ${user.username} foi excluído`);
  }

  // Alternar status do usuário
  async toggleUserStatus(userId) {
    const user = this.auth.users[userId];
    if (!user) throw new Error('Usuário não encontrado');

    if (userId === this.auth.currentUser.id) {
      throw new Error('Você não pode desativar sua própria conta');
    }

    user.active = !user.active;
    this.auth.saveUsers();

    // Registrar atividade
    this.auth.logActivity('user_status_changed', 
      `Usuário ${user.username} foi ${user.active ? 'ativado' : 'desativado'}`);
  }

  // Exportar usuários
  exportUsers() {
    const users = Object.values(this.auth.users).map(user => ({
      username: user.username,
      email: user.email,
      role: user.role,
      displayName: user.profile.displayName,
      active: user.active,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));

    const dataStr = JSON.stringify(users, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ifrit-users-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Mostrar acesso negado
  showAccessDenied() {
    alert('Você não tem permissão para acessar o gerenciamento de usuários.');
  }

  // Formatar data
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  }

  // Vincular eventos
  bindEvents() {
    document.addEventListener('click', (e) => {
      // Fechar modais
      if (e.target.id === 'closeUserManagementModal' || e.target.closest('#closeUserManagementModal')) {
        document.getElementById('userManagementModal')?.remove();
      }
      
      if (e.target.id === 'closeAddUserModal' || e.target.closest('#closeAddUserModal')) {
        document.getElementById('addUserModal')?.remove();
      }
      
      if (e.target.id === 'closeEditUserModal' || e.target.closest('#closeEditUserModal')) {
        document.getElementById('editUserModal')?.remove();
      }
      
      if (e.target.id === 'closeUserActivityModal' || e.target.closest('#closeUserActivityModal')) {
        document.getElementById('userActivityModal')?.remove();
      }

      // Botões de ação
      if (e.target.id === 'addUserBtn' || e.target.closest('#addUserBtn')) {
        this.showAddUserForm();
      }
      
      if (e.target.id === 'exportUsersBtn' || e.target.closest('#exportUsersBtn')) {
        this.exportUsers();
      }

      // Ações da tabela
      if (e.target.closest('.edit-user')) {
        const userId = e.target.closest('.edit-user').dataset.userId;
        this.showEditUserForm(userId);
      }
      
      if (e.target.closest('.view-activity')) {
        const userId = e.target.closest('.view-activity').dataset.userId;
        this.showUserActivity(userId);
      }
      
      if (e.target.closest('.toggle-status')) {
        const userId = e.target.closest('.toggle-status').dataset.userId;
        this.toggleUserStatus(userId).then(() => this.loadUsers());
      }
      
      if (e.target.closest('.delete-user')) {
        const userId = e.target.closest('.delete-user').dataset.userId;
        this.deleteUser(userId).then(() => this.loadUsers());
      }

      // Cancelar formulários
      if (e.target.id === 'cancelAddUser') {
        document.getElementById('addUserModal')?.remove();
      }
      
      if (e.target.id === 'cancelEditUser') {
        document.getElementById('editUserModal')?.remove();
      }
    });

    // Busca e filtros
    document.addEventListener('input', (e) => {
      if (e.target.id === 'userSearchInput') {
        this.loadUsers();
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'roleFilterSelect') {
        this.loadUsers();
      }
    });

    // Formulários
    document.addEventListener('submit', async (e) => {
      if (e.target.id === 'addUserForm') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const errorDiv = document.getElementById('addUserError');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;
          errorDiv.hidden = true;
          
          await this.createUser(formData);
          document.getElementById('addUserModal').remove();
          this.loadUsers();
          
        } catch (error) {
          errorDiv.textContent = error.message;
          errorDiv.hidden = false;
        } finally {
          submitBtn.disabled = false;
        }
      }
      
      if (e.target.id === 'editUserForm') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userId = e.target.dataset.userId;
        const errorDiv = document.getElementById('editUserError');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;
          errorDiv.hidden = true;
          
          await this.updateUser(userId, formData);
          document.getElementById('editUserModal').remove();
          this.loadUsers();
          
        } catch (error) {
          errorDiv.textContent = error.message;
          errorDiv.hidden = false;
        } finally {
          submitBtn.disabled = false;
        }
      }
    });
  }
}

// Integrar com o sistema de autenticação
document.addEventListener('DOMContentLoaded', () => {
  if (window.authSystem) {
    window.userManagement = new UserManagement(window.authSystem);
    
    // Sobrescrever método showUserManagement do authSystem
    window.authSystem.showUserManagement = () => {
      window.userManagement.show();
    };
  }
});
