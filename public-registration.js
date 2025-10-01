// Sistema de Registro Público e Aprovação de Itens
// Ifrit Inventory - Final Fantasy Collection

class PublicRegistration {
  constructor(authSystem) {
    this.auth = authSystem;
    this.init();
  }

  init() {
    this.addRegistrationButton();
    this.bindEvents();
  }

  // Adicionar botão de registro na tela de login
  addRegistrationButton() {
    const loginModal = document.getElementById('loginModal');
    if (!loginModal) return;

    const authHelp = loginModal.querySelector('.auth-help');
    if (!authHelp) return;

    const registerButtonHTML = `
      <div class="register-section">
        <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="text-align: center; color: #888; margin-bottom: 1rem;">
          Não tem uma conta?
        </p>
        <button type="button" id="showRegisterBtn" class="btn secondary full-width">
          <i class="fa-solid fa-user-plus"></i> Criar Nova Conta
        </button>
      </div>
    `;

    authHelp.insertAdjacentHTML('afterend', registerButtonHTML);
  }

  // Mostrar formulário de registro
  showRegistrationForm() {
    const registrationHTML = `
      <div id="registrationModal" class="modal auth-modal" aria-hidden="false">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3><i class="fa-solid fa-user-plus"></i> Criar Nova Conta</h3>
            <button type="button" class="icon-btn" id="closeRegistrationModal" aria-label="Fechar">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <form id="registrationForm" class="modal-body">
            <div class="auth-logo">
              <img src="assets/logo-meteor.svg" alt="Ifrit Inventory" width="48" height="48" />
              <h2>Junte-se à Comunidade</h2>
              <p>Contribua para a coleção Final Fantasy</p>
            </div>
            
            <div class="form-group">
              <label>
                <i class="fa-solid fa-user"></i>
                <span>Nome de Usuário</span>
                <input type="text" name="username" required pattern="[a-zA-Z0-9_]+" 
                       title="Apenas letras, números e underscore" 
                       placeholder="Ex: cloud_strife" />
              </label>
            </div>
            
            <div class="form-group">
              <label>
                <i class="fa-solid fa-envelope"></i>
                <span>Email</span>
                <input type="email" name="email" required 
                       placeholder="seu@email.com" />
              </label>
            </div>
            
            <div class="form-group">
              <label>
                <i class="fa-solid fa-id-card"></i>
                <span>Nome de Exibição</span>
                <input type="text" name="displayName" required 
                       placeholder="Como você quer ser chamado" />
              </label>
            </div>
            
            <div class="form-group">
              <label>
                <i class="fa-solid fa-lock"></i>
                <span>Senha</span>
                <input type="password" name="password" required minlength="6" 
                       placeholder="Mínimo 6 caracteres" />
              </label>
            </div>
            
            <div class="form-group">
              <label>
                <i class="fa-solid fa-lock"></i>
                <span>Confirmar Senha</span>
                <input type="password" name="confirmPassword" required minlength="6" 
                       placeholder="Digite a senha novamente" />
              </label>
            </div>
            
            <div class="registration-info">
              <div class="info-card">
                <h4><i class="fa-solid fa-info-circle"></i> Informações Importantes</h4>
                <ul>
                  <li>✅ Você entrará como <strong>Colaborador</strong></li>
                  <li>✅ Poderá adicionar itens à coleção</li>
                  <li>⏳ Novos itens precisam de aprovação do admin</li>
                  <li>✅ Poderá editar seus próprios itens</li>
                </ul>
              </div>
            </div>
            
            <div class="terms-section">
              <label class="checkbox-label">
                <input type="checkbox" name="acceptTerms" required />
                <span>Concordo em contribuir respeitosamente para a coleção</span>
              </label>
            </div>
            
            <div id="registrationError" class="error-message" hidden></div>
            
            <div class="modal-footer">
              <button type="button" class="btn" id="backToLoginBtn">
                <i class="fa-solid fa-arrow-left"></i> Voltar ao Login
              </button>
              <button type="submit" class="btn primary">
                <i class="fa-solid fa-user-plus"></i> Criar Conta
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Remover modal existente se houver
    const existingModal = document.getElementById('registrationModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', registrationHTML);
  }

  // Processar registro
  async processRegistration(formData) {
    const username = formData.get('username');
    const email = formData.get('email');
    const displayName = formData.get('displayName');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const acceptTerms = formData.get('acceptTerms');

    // Validações
    if (!acceptTerms) {
      throw new Error('Você deve concordar com os termos para continuar');
    }

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
      role: 'CONTRIBUTOR', // Sempre entra como colaborador
      createdAt: new Date().toISOString(),
      lastLogin: null,
      active: true,
      profile: {
        displayName,
        avatar: null,
        preferences: {
          theme: 'dark',
          language: 'pt-BR'
        }
      },
      registrationMethod: 'public', // Marcar como registro público
      needsApproval: true // Itens precisam de aprovação
    };

    // Salvar usuário
    this.auth.users[userId] = newUser;
    this.auth.saveUsers();

    // Registrar atividade
    this.auth.logActivity('user_registered', `Usuário ${username} se registrou publicamente`);

    // Notificar admins sobre novo registro
    this.notifyAdminsNewUser(newUser);

    return newUser;
  }

  // Notificar admins sobre novo usuário
  notifyAdminsNewUser(user) {
    const notifications = JSON.parse(localStorage.getItem('ifrit_admin_notifications') || '[]');
    
    notifications.push({
      id: Date.now().toString(),
      type: 'new_user',
      title: 'Novo Usuário Registrado',
      message: `${user.profile.displayName} (@${user.username}) se registrou no sistema`,
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        userId: user.id,
        username: user.username,
        email: user.email
      }
    });

    localStorage.setItem('ifrit_admin_notifications', JSON.stringify(notifications));
  }

  // Vincular eventos
  bindEvents() {
    document.addEventListener('click', (e) => {
      // Mostrar formulário de registro
      if (e.target.id === 'showRegisterBtn' || e.target.closest('#showRegisterBtn')) {
        this.showRegistrationForm();
      }

      // Voltar ao login
      if (e.target.id === 'backToLoginBtn' || e.target.closest('#backToLoginBtn')) {
        document.getElementById('registrationModal')?.remove();
      }

      // Fechar modal de registro
      if (e.target.id === 'closeRegistrationModal' || e.target.closest('#closeRegistrationModal')) {
        document.getElementById('registrationModal')?.remove();
      }
    });

    // Processar formulário de registro
    document.addEventListener('submit', async (e) => {
      if (e.target.id === 'registrationForm') {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const errorDiv = document.getElementById('registrationError');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Criando conta...';
          errorDiv.hidden = true;

          const newUser = await this.processRegistration(formData);
          
          // Mostrar sucesso e fazer login automático
          document.getElementById('registrationModal').remove();
          this.showRegistrationSuccess(newUser);
          
          // Fazer login automático
          await this.auth.login(newUser.username, formData.get('password'));
          
        } catch (error) {
          errorDiv.textContent = error.message;
          errorDiv.hidden = false;
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Criar Conta';
        }
      }
    });
  }

  // Mostrar mensagem de sucesso
  showRegistrationSuccess(user) {
    const successHTML = `
      <div id="registrationSuccessModal" class="modal auth-modal" aria-hidden="false">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3><i class="fa-solid fa-check-circle" style="color: #4CAF50;"></i> Conta Criada!</h3>
          </div>
          
          <div class="modal-body">
            <div class="success-content">
              <div class="welcome-message">
                <h2>Bem-vindo, ${user.profile.displayName}! 🎉</h2>
                <p>Sua conta foi criada com sucesso!</p>
              </div>
              
              <div class="account-info">
                <h4>Informações da sua conta:</h4>
                <ul>
                  <li><strong>Usuário:</strong> ${user.username}</li>
                  <li><strong>Email:</strong> ${user.email}</li>
                  <li><strong>Nível:</strong> <span class="role-indicator contributor">Colaborador</span></li>
                </ul>
              </div>
              
              <div class="next-steps">
                <h4>Próximos passos:</h4>
                <ul>
                  <li>✅ Explore a coleção Final Fantasy</li>
                  <li>✅ Adicione itens que você possui</li>
                  <li>⏳ Seus novos itens precisarão de aprovação</li>
                  <li>✅ Edite seus próprios itens quando quiser</li>
                </ul>
              </div>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn primary full-width" id="startExploringBtn">
                <i class="fa-solid fa-rocket"></i> Começar a Explorar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', successHTML);

    // Fechar modal após 3 segundos ou ao clicar
    document.getElementById('startExploringBtn').onclick = () => {
      document.getElementById('registrationSuccessModal').remove();
    };

    setTimeout(() => {
      document.getElementById('registrationSuccessModal')?.remove();
    }, 10000);
  }
}

// Sistema de Aprovação de Itens
class ItemApprovalSystem {
  constructor(authSystem) {
    this.auth = authSystem;
    this.init();
  }

  init() {
    this.interceptItemCreation();
    this.addApprovalInterface();
  }

  // Interceptar criação de itens para usuários que precisam de aprovação
  interceptItemCreation() {
    // Aguardar que o sistema principal esteja carregado
    const checkSystem = setInterval(() => {
      if (window.addItem) {
        clearInterval(checkSystem);
        this.setupItemInterception();
      }
    }, 100);
  }

  setupItemInterception() {
    const originalAddItem = window.addItem;
    
    window.addItem = (itemData) => {
      const user = this.auth.users[this.auth.currentUser.id];
      
      // Se o usuário precisa de aprovação, marcar item como pendente
      if (user && user.needsApproval) {
        itemData.status = 'pending_approval';
        itemData.approvedBy = null;
        itemData.approvedAt = null;
        
        // Salvar em lista separada de itens pendentes
        this.savePendingItem(itemData);
        
        // Notificar admins
        this.notifyAdminsNewItem(itemData);
        
        // Mostrar mensagem para o usuário
        this.showItemPendingMessage(itemData);
        
        return; // Não adicionar ao sistema principal ainda
      }
      
      // Se não precisa de aprovação, adicionar normalmente
      return originalAddItem(itemData);
    };
  }

  // Salvar item pendente
  savePendingItem(itemData) {
    const pendingItems = JSON.parse(localStorage.getItem('ifrit_pending_items') || '[]');
    
    itemData.id = Date.now().toString();
    itemData.submittedAt = new Date().toISOString();
    itemData.submittedBy = this.auth.currentUser.id;
    
    pendingItems.push(itemData);
    localStorage.setItem('ifrit_pending_items', JSON.stringify(pendingItems));
  }

  // Notificar admins sobre novo item
  notifyAdminsNewItem(item) {
    const notifications = JSON.parse(localStorage.getItem('ifrit_admin_notifications') || '[]');
    
    notifications.push({
      id: Date.now().toString(),
      type: 'new_item',
      title: 'Novo Item Pendente',
      message: `${this.auth.currentUser.profile.displayName} enviou "${item.name}" para aprovação`,
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        itemId: item.id,
        itemName: item.name,
        userId: this.auth.currentUser.id
      }
    });

    localStorage.setItem('ifrit_admin_notifications', JSON.stringify(notifications));
  }

  // Mostrar mensagem de item pendente
  showItemPendingMessage(item) {
    const messageHTML = `
      <div class="pending-item-notification">
        <i class="fa-solid fa-clock"></i>
        <div>
          <strong>Item enviado para aprovação!</strong>
          <p>"${item.name}" será revisado por um administrador.</p>
        </div>
        <button class="close-notification">&times;</button>
      </div>
    `;

    const notification = document.createElement('div');
    notification.innerHTML = messageHTML;
    notification.className = 'notification-container';
    
    document.body.appendChild(notification);

    // Auto-remover após 5 segundos
    setTimeout(() => notification.remove(), 5000);
    
    // Remover ao clicar
    notification.querySelector('.close-notification').onclick = () => notification.remove();
  }

  // Adicionar interface de aprovação para admins
  addApprovalInterface() {
    if (!this.auth.hasPermission(this.auth.permissions.MANAGE_USERS)) return;

    // Adicionar botão de aprovações no header
    const userActions = document.querySelector('.user-actions');
    if (userActions) {
      const approvalBtn = document.createElement('button');
      approvalBtn.id = 'approvalBtn';
      approvalBtn.className = 'btn secondary';
      approvalBtn.innerHTML = '<i class="fa-solid fa-tasks"></i>';
      approvalBtn.title = 'Aprovações Pendentes';
      
      userActions.insertBefore(approvalBtn, userActions.firstChild);
      
      // Mostrar contador de pendências
      this.updateApprovalCounter();
    }
  }

  // Atualizar contador de aprovações
  updateApprovalCounter() {
    const pendingItems = JSON.parse(localStorage.getItem('ifrit_pending_items') || '[]');
    const notifications = JSON.parse(localStorage.getItem('ifrit_admin_notifications') || '[]');
    const unreadNotifications = notifications.filter(n => !n.read);
    
    const total = pendingItems.length + unreadNotifications.length;
    
    const approvalBtn = document.getElementById('approvalBtn');
    if (approvalBtn && total > 0) {
      approvalBtn.innerHTML = `<i class="fa-solid fa-tasks"></i> <span class="badge">${total}</span>`;
    }
  }

  // Mostrar interface de aprovações
  showApprovalInterface() {
    // Implementar interface completa de aprovações
    console.log('Abrindo interface de aprovações...');
  }
}

// Inicializar sistemas quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  if (window.authSystem) {
    window.publicRegistration = new PublicRegistration(window.authSystem);
    window.itemApprovalSystem = new ItemApprovalSystem(window.authSystem);
  }
});
