// Interface de Aprovação de Itens para Administradores
// Ifrit Inventory - Final Fantasy Collection

class ItemApprovalInterface {
  constructor(authSystem) {
    this.auth = authSystem;
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateApprovalCounter();
  }

  // Mostrar interface de aprovações
  show() {
    if (!this.auth.hasPermission(this.auth.permissions.MANAGE_USERS)) {
      alert('Você não tem permissão para acessar aprovações.');
      return;
    }

    this.createApprovalModal();
    this.loadPendingItems();
    this.loadNotifications();
  }

  // Criar modal de aprovações
  createApprovalModal() {
    const existingModal = document.getElementById('approvalModal');
    if (existingModal) existingModal.remove();

    const modalHTML = `
      <div id="approvalModal" class="modal approval-modal" aria-hidden="false">
        <div class="modal-dialog large">
          <div class="modal-header">
            <h3><i class="fa-solid fa-tasks"></i> Centro de Aprovações</h3>
            <button type="button" class="icon-btn" id="closeApprovalModal" aria-label="Fechar">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="approval-tabs">
              <button class="tab-btn active" data-tab="items">
                <i class="fa-solid fa-box"></i> Itens Pendentes
                <span class="tab-badge" id="itemsTabBadge">0</span>
              </button>
              <button class="tab-btn" data-tab="notifications">
                <i class="fa-solid fa-bell"></i> Notificações
                <span class="tab-badge" id="notificationsTabBadge">0</span>
              </button>
            </div>

            <div class="tab-content">
              <!-- Aba de Itens Pendentes -->
              <div id="itemsTab" class="tab-panel active">
                <div class="approval-toolbar">
                  <div class="toolbar-info">
                    <h4>Itens aguardando aprovação</h4>
                    <p>Revise os itens enviados pelos colaboradores</p>
                  </div>
                  <div class="toolbar-actions">
                    <button id="approveAllBtn" class="btn success" disabled>
                      <i class="fa-solid fa-check-double"></i> Aprovar Todos
                    </button>
                    <button id="refreshItemsBtn" class="btn secondary">
                      <i class="fa-solid fa-refresh"></i> Atualizar
                    </button>
                  </div>
                </div>

                <div id="pendingItemsList" class="pending-items-list">
                  <!-- Itens pendentes serão carregados aqui -->
                </div>

                <div id="noItemsMessage" class="empty-state" hidden>
                  <i class="fa-regular fa-smile"></i>
                  <h3>Nenhum item pendente!</h3>
                  <p>Todos os itens foram revisados.</p>
                </div>
              </div>

              <!-- Aba de Notificações -->
              <div id="notificationsTab" class="tab-panel">
                <div class="approval-toolbar">
                  <div class="toolbar-info">
                    <h4>Notificações do sistema</h4>
                    <p>Novos usuários e atividades importantes</p>
                  </div>
                  <div class="toolbar-actions">
                    <button id="markAllReadBtn" class="btn secondary">
                      <i class="fa-solid fa-check"></i> Marcar Tudo Lido
                    </button>
                    <button id="clearNotificationsBtn" class="btn danger">
                      <i class="fa-solid fa-trash"></i> Limpar Todas
                    </button>
                  </div>
                </div>

                <div id="notificationsList" class="notifications-list">
                  <!-- Notificações serão carregadas aqui -->
                </div>

                <div id="noNotificationsMessage" class="empty-state" hidden>
                  <i class="fa-regular fa-bell-slash"></i>
                  <h3>Nenhuma notificação</h3>
                  <p>Você está em dia com tudo!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // Carregar itens pendentes
  loadPendingItems() {
    const pendingItems = JSON.parse(localStorage.getItem('ifrit_pending_items') || '[]');
    const container = document.getElementById('pendingItemsList');
    const noItemsMessage = document.getElementById('noItemsMessage');
    const itemsTabBadge = document.getElementById('itemsTabBadge');
    const approveAllBtn = document.getElementById('approveAllBtn');

    // Atualizar badge
    itemsTabBadge.textContent = pendingItems.length;
    itemsTabBadge.style.display = pendingItems.length > 0 ? 'inline' : 'none';

    // Habilitar/desabilitar botão de aprovar todos
    approveAllBtn.disabled = pendingItems.length === 0;

    if (pendingItems.length === 0) {
      container.innerHTML = '';
      noItemsMessage.hidden = false;
      return;
    }

    noItemsMessage.hidden = true;
    container.innerHTML = '';

    pendingItems.forEach(item => {
      const itemCard = this.createPendingItemCard(item);
      container.appendChild(itemCard);
    });
  }

  // Criar card de item pendente
  createPendingItemCard(item) {
    const submittedBy = this.auth.users[item.submittedBy];
    const submittedDate = new Date(item.submittedAt).toLocaleString('pt-BR');

    const card = document.createElement('div');
    card.className = 'pending-item-card';
    card.dataset.itemId = item.id;

    card.innerHTML = `
      <div class="item-preview">
        ${item.image ? 
          `<img src="${item.image}" alt="${item.name}" class="item-image" />` :
          `<div class="item-placeholder"><i class="fa-solid fa-image"></i></div>`
        }
      </div>
      
      <div class="item-details">
        <div class="item-header">
          <h4 class="item-name">${item.name}</h4>
          <div class="item-meta">
            <span class="category-badge">${item.category}</span>
            <span class="platform-badge">${item.platform}</span>
            ${item.year ? `<span class="year-badge">${item.year}</span>` : ''}
          </div>
        </div>
        
        <div class="item-info">
          ${item.notes ? `<p class="item-notes">${item.notes}</p>` : ''}
          <div class="rarity-display">
            <span>Raridade:</span>
            <div class="stars">
              ${Array.from({length: 5}, (_, i) => 
                `<i class="fa-${i < item.rarity ? 'solid' : 'regular'} fa-star"></i>`
              ).join('')}
            </div>
          </div>
        </div>
        
        <div class="submission-info">
          <div class="submitted-by">
            <i class="fa-solid fa-user"></i>
            <span>Enviado por: <strong>${submittedBy ? submittedBy.profile.displayName : 'Usuário desconhecido'}</strong></span>
          </div>
          <div class="submitted-date">
            <i class="fa-solid fa-clock"></i>
            <span>${submittedDate}</span>
          </div>
        </div>
      </div>
      
      <div class="item-actions">
        <button class="btn success approve-item-btn" data-item-id="${item.id}">
          <i class="fa-solid fa-check"></i> Aprovar
        </button>
        <button class="btn danger reject-item-btn" data-item-id="${item.id}">
          <i class="fa-solid fa-times"></i> Rejeitar
        </button>
        <button class="btn secondary edit-before-approve-btn" data-item-id="${item.id}">
          <i class="fa-solid fa-edit"></i> Editar e Aprovar
        </button>
      </div>
    `;

    return card;
  }

  // Carregar notificações
  loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem('ifrit_admin_notifications') || '[]');
    const container = document.getElementById('notificationsList');
    const noNotificationsMessage = document.getElementById('noNotificationsMessage');
    const notificationsTabBadge = document.getElementById('notificationsTabBadge');

    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Atualizar badge
    notificationsTabBadge.textContent = unreadCount;
    notificationsTabBadge.style.display = unreadCount > 0 ? 'inline' : 'none';

    if (notifications.length === 0) {
      container.innerHTML = '';
      noNotificationsMessage.hidden = false;
      return;
    }

    noNotificationsMessage.hidden = true;
    container.innerHTML = '';

    // Ordenar por data (mais recentes primeiro)
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    notifications.forEach(notification => {
      const notificationCard = this.createNotificationCard(notification);
      container.appendChild(notificationCard);
    });
  }

  // Criar card de notificação
  createNotificationCard(notification) {
    const date = new Date(notification.timestamp).toLocaleString('pt-BR');
    const typeIcons = {
      'new_user': 'fa-user-plus',
      'new_item': 'fa-box',
      'system': 'fa-cog'
    };

    const card = document.createElement('div');
    card.className = `notification-card ${notification.read ? 'read' : 'unread'}`;
    card.dataset.notificationId = notification.id;

    card.innerHTML = `
      <div class="notification-icon">
        <i class="fa-solid ${typeIcons[notification.type] || 'fa-bell'}"></i>
      </div>
      
      <div class="notification-content">
        <h4 class="notification-title">${notification.title}</h4>
        <p class="notification-message">${notification.message}</p>
        <div class="notification-date">${date}</div>
      </div>
      
      <div class="notification-actions">
        ${!notification.read ? 
          `<button class="btn-icon mark-read-btn" data-notification-id="${notification.id}" title="Marcar como lida">
            <i class="fa-solid fa-check"></i>
          </button>` : ''
        }
        <button class="btn-icon delete-notification-btn" data-notification-id="${notification.id}" title="Excluir">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    return card;
  }

  // Aprovar item
  async approveItem(itemId) {
    const pendingItems = JSON.parse(localStorage.getItem('ifrit_pending_items') || '[]');
    const itemIndex = pendingItems.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      alert('Item não encontrado');
      return;
    }

    const item = pendingItems[itemIndex];
    
    // Marcar como aprovado
    item.status = 'approved';
    item.approvedBy = this.auth.currentUser.id;
    item.approvedAt = new Date().toISOString();

    // Adicionar ao sistema principal
    if (window.state && window.state.items) {
      // Remover campos específicos de aprovação antes de adicionar
      const cleanItem = { ...item };
      delete cleanItem.submittedAt;
      delete cleanItem.submittedBy;
      delete cleanItem.status;
      
      window.state.items.push(cleanItem);
      
      // Salvar no localStorage do sistema principal
      localStorage.setItem('ifrit_items', JSON.stringify(window.state.items));
      
      // Atualizar display se a função existir
      if (window.renderItems) {
        window.renderItems();
      }
    }

    // Remover da lista de pendentes
    pendingItems.splice(itemIndex, 1);
    localStorage.setItem('ifrit_pending_items', JSON.stringify(pendingItems));

    // Registrar atividade
    this.auth.logActivity('item_approved', `Item "${item.name}" foi aprovado`);

    // Notificar usuário que enviou
    this.notifyUserItemApproved(item);

    // Recarregar lista
    this.loadPendingItems();
    this.updateApprovalCounter();

    // Mostrar sucesso
    this.showSuccessMessage(`Item "${item.name}" aprovado com sucesso!`);
  }

  // Rejeitar item
  async rejectItem(itemId) {
    const reason = prompt('Motivo da rejeição (opcional):');
    
    const pendingItems = JSON.parse(localStorage.getItem('ifrit_pending_items') || '[]');
    const itemIndex = pendingItems.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      alert('Item não encontrado');
      return;
    }

    const item = pendingItems[itemIndex];

    // Registrar atividade
    this.auth.logActivity('item_rejected', 
      `Item "${item.name}" foi rejeitado${reason ? `: ${reason}` : ''}`);

    // Notificar usuário que enviou
    this.notifyUserItemRejected(item, reason);

    // Remover da lista de pendentes
    pendingItems.splice(itemIndex, 1);
    localStorage.setItem('ifrit_pending_items', JSON.stringify(pendingItems));

    // Recarregar lista
    this.loadPendingItems();
    this.updateApprovalCounter();

    // Mostrar sucesso
    this.showSuccessMessage(`Item "${item.name}" rejeitado.`);
  }

  // Aprovar todos os itens
  async approveAllItems() {
    const confirmed = confirm('Tem certeza que deseja aprovar TODOS os itens pendentes?');
    if (!confirmed) return;

    const pendingItems = JSON.parse(localStorage.getItem('ifrit_pending_items') || '[]');
    
    for (const item of pendingItems) {
      await this.approveItem(item.id);
    }

    this.showSuccessMessage(`${pendingItems.length} itens aprovados com sucesso!`);
  }

  // Notificar usuário sobre aprovação
  notifyUserItemApproved(item) {
    // Implementar sistema de notificação para usuários
    console.log(`Notificar usuário ${item.submittedBy}: item "${item.name}" aprovado`);
  }

  // Notificar usuário sobre rejeição
  notifyUserItemRejected(item, reason) {
    // Implementar sistema de notificação para usuários
    console.log(`Notificar usuário ${item.submittedBy}: item "${item.name}" rejeitado`, reason);
  }

  // Marcar notificação como lida
  markNotificationAsRead(notificationId) {
    const notifications = JSON.parse(localStorage.getItem('ifrit_admin_notifications') || '[]');
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      localStorage.setItem('ifrit_admin_notifications', JSON.stringify(notifications));
      this.loadNotifications();
      this.updateApprovalCounter();
    }
  }

  // Excluir notificação
  deleteNotification(notificationId) {
    const notifications = JSON.parse(localStorage.getItem('ifrit_admin_notifications') || '[]');
    const filteredNotifications = notifications.filter(n => n.id !== notificationId);
    
    localStorage.setItem('ifrit_admin_notifications', JSON.stringify(filteredNotifications));
    this.loadNotifications();
    this.updateApprovalCounter();
  }

  // Marcar todas as notificações como lidas
  markAllNotificationsAsRead() {
    const notifications = JSON.parse(localStorage.getItem('ifrit_admin_notifications') || '[]');
    notifications.forEach(n => n.read = true);
    
    localStorage.setItem('ifrit_admin_notifications', JSON.stringify(notifications));
    this.loadNotifications();
    this.updateApprovalCounter();
  }

  // Limpar todas as notificações
  clearAllNotifications() {
    const confirmed = confirm('Tem certeza que deseja excluir todas as notificações?');
    if (!confirmed) return;

    localStorage.setItem('ifrit_admin_notifications', '[]');
    this.loadNotifications();
    this.updateApprovalCounter();
  }

  // Atualizar contador de aprovações
  updateApprovalCounter() {
    const pendingItems = JSON.parse(localStorage.getItem('ifrit_pending_items') || '[]');
    const notifications = JSON.parse(localStorage.getItem('ifrit_admin_notifications') || '[]');
    const unreadNotifications = notifications.filter(n => !n.read);
    
    const total = pendingItems.length + unreadNotifications.length;
    
    const approvalBtn = document.getElementById('approvalBtn');
    if (approvalBtn) {
      if (total > 0) {
        approvalBtn.innerHTML = `<i class="fa-solid fa-tasks"></i> <span class="badge">${total}</span>`;
      } else {
        approvalBtn.innerHTML = '<i class="fa-solid fa-tasks"></i>';
      }
    }
  }

  // Mostrar mensagem de sucesso
  showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
      <i class="fa-solid fa-check-circle"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  // Vincular eventos
  bindEvents() {
    document.addEventListener('click', (e) => {
      // Abrir modal de aprovações
      if (e.target.id === 'approvalBtn' || e.target.closest('#approvalBtn')) {
        this.show();
      }

      // Fechar modal
      if (e.target.id === 'closeApprovalModal' || e.target.closest('#closeApprovalModal')) {
        document.getElementById('approvalModal')?.remove();
      }

      // Tabs
      if (e.target.classList.contains('tab-btn')) {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      }

      // Ações de itens
      if (e.target.classList.contains('approve-item-btn') || e.target.closest('.approve-item-btn')) {
        const itemId = (e.target.closest('.approve-item-btn') || e.target).dataset.itemId;
        this.approveItem(itemId);
      }

      if (e.target.classList.contains('reject-item-btn') || e.target.closest('.reject-item-btn')) {
        const itemId = (e.target.closest('.reject-item-btn') || e.target).dataset.itemId;
        this.rejectItem(itemId);
      }

      // Aprovar todos
      if (e.target.id === 'approveAllBtn') {
        this.approveAllItems();
      }

      // Atualizar itens
      if (e.target.id === 'refreshItemsBtn') {
        this.loadPendingItems();
      }

      // Ações de notificações
      if (e.target.classList.contains('mark-read-btn') || e.target.closest('.mark-read-btn')) {
        const notificationId = (e.target.closest('.mark-read-btn') || e.target).dataset.notificationId;
        this.markNotificationAsRead(notificationId);
      }

      if (e.target.classList.contains('delete-notification-btn') || e.target.closest('.delete-notification-btn')) {
        const notificationId = (e.target.closest('.delete-notification-btn') || e.target).dataset.notificationId;
        this.deleteNotification(notificationId);
      }

      // Marcar todas como lidas
      if (e.target.id === 'markAllReadBtn') {
        this.markAllNotificationsAsRead();
      }

      // Limpar todas
      if (e.target.id === 'clearNotificationsBtn') {
        this.clearAllNotifications();
      }
    });
  }

  // Alternar entre tabs
  switchTab(tabName) {
    // Atualizar botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Atualizar painéis
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}Tab`);
    });
  }
}

// Inicializar quando o sistema de auth estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  if (window.authSystem) {
    window.itemApprovalInterface = new ItemApprovalInterface(window.authSystem);
  }
});
