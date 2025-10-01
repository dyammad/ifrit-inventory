// Integração do Sistema de Autenticação com o Ifrit Inventory
// Este arquivo modifica o comportamento do script principal para incluir controle de acesso

(function() {
  'use strict';

  // Aguardar que todos os sistemas estejam carregados
  document.addEventListener('DOMContentLoaded', function() {
    if (!window.authSystem) {
      console.error('Sistema de autenticação não encontrado');
      return;
    }

    // Integrar com o sistema existente
    integrateWithInventorySystem();
  });

  function integrateWithInventorySystem() {
    // Aguardar que o sistema de inventário esteja disponível
    const checkInventorySystem = setInterval(() => {
      if (window.state && typeof window.addItem === 'function') {
        clearInterval(checkInventorySystem);
        setupAuthIntegration();
      }
    }, 100);
  }

  function setupAuthIntegration() {
    const auth = window.authSystem;
    
    // Interceptar funções de adição de itens
    const originalAddItem = window.addItem;
    window.addItem = function(itemData) {
      if (!auth.hasPermission(auth.permissions.CREATE_ITEMS)) {
        showPermissionDenied('Você não tem permissão para adicionar itens.');
        return;
      }

      // Adicionar informações do usuário ao item
      itemData.createdBy = auth.currentUser.id;
      itemData.createdAt = new Date().toISOString();
      itemData.updatedBy = auth.currentUser.id;
      itemData.updatedAt = new Date().toISOString();

      // Registrar atividade
      auth.logActivity('create_item', `Item "${itemData.name}" foi criado`);

      return originalAddItem.call(this, itemData);
    };

    // Interceptar funções de edição de itens
    if (window.editItem) {
      const originalEditItem = window.editItem;
      window.editItem = function(itemId, itemData) {
        const item = window.state.items.find(i => i.id === itemId);
        
        if (!item) {
          showPermissionDenied('Item não encontrado.');
          return;
        }

        // Verificar permissões
        const canEditAny = auth.hasPermission(auth.permissions.EDIT_ITEMS);
        const canEditOwn = auth.hasPermission(auth.permissions.EDIT_OWN_ITEMS) && auth.isOwner(item);

        if (!canEditAny && !canEditOwn) {
          showPermissionDenied('Você não tem permissão para editar este item.');
          return;
        }

        // Adicionar informações de atualização
        itemData.updatedBy = auth.currentUser.id;
        itemData.updatedAt = new Date().toISOString();

        // Registrar atividade
        auth.logActivity('edit_item', `Item "${itemData.name}" foi editado`);

        return originalEditItem.call(this, itemId, itemData);
      };
    }

    // Interceptar funções de exclusão de itens
    if (window.deleteItem) {
      const originalDeleteItem = window.deleteItem;
      window.deleteItem = function(itemId) {
        const item = window.state.items.find(i => i.id === itemId);
        
        if (!item) {
          showPermissionDenied('Item não encontrado.');
          return;
        }

        // Verificar permissões
        const canDeleteAny = auth.hasPermission(auth.permissions.DELETE_ITEMS);
        const canDeleteOwn = auth.hasPermission(auth.permissions.DELETE_OWN_ITEMS) && auth.isOwner(item);

        if (!canDeleteAny && !canDeleteOwn) {
          showPermissionDenied('Você não tem permissão para excluir este item.');
          return;
        }

        // Registrar atividade
        auth.logActivity('delete_item', `Item "${item.name}" foi excluído`);

        return originalDeleteItem.call(this, itemId);
      };
    }

    // Interceptar funções de importação/exportação
    if (window.exportData) {
      const originalExportData = window.exportData;
      window.exportData = function() {
        if (!auth.hasPermission(auth.permissions.EXPORT_DATA)) {
          showPermissionDenied('Você não tem permissão para exportar dados.');
          return;
        }

        auth.logActivity('export_data', 'Dados foram exportados');
        return originalExportData.call(this);
      };
    }

    if (window.importData) {
      const originalImportData = window.importData;
      window.importData = function(data) {
        if (!auth.hasPermission(auth.permissions.IMPORT_DATA)) {
          showPermissionDenied('Você não tem permissão para importar dados.');
          return;
        }

        auth.logActivity('import_data', 'Dados foram importados');
        return originalImportData.call(this, data);
      };
    }

    // Interceptar reset do banco de dados
    if (window.resetDatabase) {
      const originalResetDatabase = window.resetDatabase;
      window.resetDatabase = function() {
        if (!auth.hasPermission(auth.permissions.RESET_DATABASE)) {
          showPermissionDenied('Você não tem permissão para resetar o banco de dados.');
          return;
        }

        const confirmed = confirm('ATENÇÃO: Esta ação irá resetar completamente o banco de dados. Todos os itens serão perdidos. Tem certeza?');
        if (!confirmed) return;

        auth.logActivity('reset_database', 'Banco de dados foi resetado');
        return originalResetDatabase.call(this);
      };
    }

    // Adicionar controles de permissão aos cards de itens
    enhanceItemCards();

    // Configurar observador para novos cards
    setupCardObserver();

    // Atualizar interface baseada no usuário
    updateUIForCurrentUser();
  }

  function enhanceItemCards() {
    const itemCards = document.querySelectorAll('.item-card');
    itemCards.forEach(card => addPermissionControlsToCard(card));
  }

  function addPermissionControlsToCard(card) {
    const auth = window.authSystem;
    if (!auth.isAuthenticated()) return;

    const itemId = card.dataset.itemId;
    if (!itemId) return;

    const item = window.state.items.find(i => i.id === itemId);
    if (!item) return;

    // Adicionar indicador de proprietário
    if (item.createdBy === auth.currentUser.id) {
      const ownerBadge = document.createElement('div');
      ownerBadge.className = 'owner-badge';
      ownerBadge.innerHTML = '<i class="fa-solid fa-user"></i> Seu item';
      card.appendChild(ownerBadge);
    }

    // Adicionar botões de ação baseados em permissões
    const actionsContainer = card.querySelector('.item-actions') || createActionsContainer(card);
    
    // Botão de editar
    const canEdit = auth.hasPermission(auth.permissions.EDIT_ITEMS) || 
                   (auth.hasPermission(auth.permissions.EDIT_OWN_ITEMS) && auth.isOwner(item));
    
    if (canEdit) {
      const editBtn = document.createElement('button');
      editBtn.className = 'btn-icon edit-item-btn';
      editBtn.innerHTML = '<i class="fa-solid fa-edit"></i>';
      editBtn.title = 'Editar item';
      editBtn.onclick = () => editItemFromCard(itemId);
      actionsContainer.appendChild(editBtn);
    }

    // Botão de excluir
    const canDelete = auth.hasPermission(auth.permissions.DELETE_ITEMS) || 
                     (auth.hasPermission(auth.permissions.DELETE_OWN_ITEMS) && auth.isOwner(item));
    
    if (canDelete) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-icon delete-item-btn';
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
      deleteBtn.title = 'Excluir item';
      deleteBtn.onclick = () => deleteItemFromCard(itemId);
      actionsContainer.appendChild(deleteBtn);
    }
  }

  function createActionsContainer(card) {
    const container = document.createElement('div');
    container.className = 'item-actions';
    card.appendChild(container);
    return container;
  }

  function editItemFromCard(itemId) {
    // Implementar edição de item
    console.log('Editando item:', itemId);
    // Aqui você pode abrir um modal de edição ou redirecionar para uma página de edição
  }

  function deleteItemFromCard(itemId) {
    const item = window.state.items.find(i => i.id === itemId);
    if (!item) return;

    const confirmed = confirm(`Tem certeza que deseja excluir "${item.name}"?`);
    if (confirmed && window.deleteItem) {
      window.deleteItem(itemId);
    }
  }

  function setupCardObserver() {
    // Observar mudanças no DOM para aplicar controles de permissão a novos cards
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList && node.classList.contains('item-card')) {
              addPermissionControlsToCard(node);
            } else {
              const cards = node.querySelectorAll && node.querySelectorAll('.item-card');
              if (cards) {
                cards.forEach(addPermissionControlsToCard);
              }
            }
          }
        });
      });
    });

    const itemsGrid = document.getElementById('itemsGrid');
    if (itemsGrid) {
      observer.observe(itemsGrid, { childList: true, subtree: true });
    }
  }

  function updateUIForCurrentUser() {
    const auth = window.authSystem;
    if (!auth.isAuthenticated()) return;

    // Adicionar informações do usuário aos filtros avançados
    if (auth.hasPermission(auth.permissions.ADVANCED_FILTERS)) {
      addAdvancedFilters();
    }

    // Mostrar estatísticas de usuário
    if (auth.hasPermission(auth.permissions.VIEW_USER_ACTIVITY)) {
      addUserStats();
    }
  }

  function addAdvancedFilters() {
    const filtersSection = document.querySelector('.filters');
    if (!filtersSection) return;

    const advancedFiltersHTML = `
      <h4>Filtros Avançados</h4>
      <label class="filter">
        <span>Criado por</span>
        <select id="createdByFilter">
          <option value="">Todos os usuários</option>
          <option value="me">Meus itens</option>
        </select>
      </label>
      <label class="filter">
        <span>Data de criação</span>
        <input type="date" id="createdAfterFilter" />
      </label>
    `;

    filtersSection.insertAdjacentHTML('beforeend', advancedFiltersHTML);

    // Vincular eventos dos filtros avançados
    document.getElementById('createdByFilter')?.addEventListener('change', applyAdvancedFilters);
    document.getElementById('createdAfterFilter')?.addEventListener('change', applyAdvancedFilters);
  }

  function applyAdvancedFilters() {
    const auth = window.authSystem;
    const createdByFilter = document.getElementById('createdByFilter')?.value;
    const createdAfterFilter = document.getElementById('createdAfterFilter')?.value;

    // Aplicar filtros ao estado atual
    if (window.state && window.state.items) {
      let filteredItems = [...window.state.items];

      if (createdByFilter === 'me') {
        filteredItems = filteredItems.filter(item => item.createdBy === auth.currentUser.id);
      }

      if (createdAfterFilter) {
        const filterDate = new Date(createdAfterFilter);
        filteredItems = filteredItems.filter(item => {
          const itemDate = new Date(item.createdAt || '1970-01-01');
          return itemDate >= filterDate;
        });
      }

      // Atualizar a exibição (assumindo que existe uma função para isso)
      if (window.updateDisplay) {
        window.updateDisplay(filteredItems);
      }
    }
  }

  function addUserStats() {
    const statsBar = document.getElementById('statsBar');
    if (!statsBar) return;

    const auth = window.authSystem;
    const userItems = window.state.items.filter(item => item.createdBy === auth.currentUser.id);

    const userStatsHTML = `
      <div class="stat-card user-stat">
        <div class="stat-value">${userItems.length}</div>
        <div class="stat-label">Seus Itens</div>
      </div>
    `;

    statsBar.insertAdjacentHTML('beforeend', userStatsHTML);
  }

  function showPermissionDenied(message) {
    // Criar notificação de permissão negada
    const notification = document.createElement('div');
    notification.className = 'permission-notification error';
    notification.innerHTML = `
      <i class="fa-solid fa-shield-halved"></i>
      <span>${message}</span>
      <button class="close-notification">&times;</button>
    `;

    document.body.appendChild(notification);

    // Auto-remover após 5 segundos
    setTimeout(() => {
      notification.remove();
    }, 5000);

    // Remover ao clicar no X
    notification.querySelector('.close-notification').onclick = () => {
      notification.remove();
    };
  }

  // Estilos para os novos elementos
  const style = document.createElement('style');
  style.textContent = `
    .owner-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(255, 77, 46, 0.9);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .item-actions {
      position: absolute;
      bottom: 0.5rem;
      right: 0.5rem;
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .item-card:hover .item-actions {
      opacity: 1;
    }

    .btn-icon {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      background: rgba(0, 0, 0, 0.9);
      transform: scale(1.1);
    }

    .edit-item-btn:hover {
      background: rgba(76, 175, 80, 0.8);
    }

    .delete-item-btn:hover {
      background: rgba(244, 67, 54, 0.8);
    }

    .permission-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(244, 67, 54, 0.95);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideInRight 0.3s ease-out;
    }

    .permission-notification .close-notification {
      background: none;
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      margin-left: 0.5rem;
    }

    .user-stat {
      background: rgba(255, 77, 46, 0.1);
      border: 1px solid rgba(255, 77, 46, 0.3);
    }

    .user-stat .stat-value {
      color: #ff4d2e;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

})();
