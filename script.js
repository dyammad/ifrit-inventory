// Ifrit Inventory — organização de coleção Final Fantasy
// Sem dependências. Renderização e estado em JS puro.

;(function(){
  const state = {
    items: [],
    filtered: [],
    categories: [
      'Todos',
      'Jogos',
      'Livros',
      'Loteria Final Fantasy VII Remake',
      'Loteria Final Fantasy IX',
      'Loteria Final Fantasy XVI',
      'Trilhas Sonoras',
      'Music Box',
      'Merch',
      'Artbook/Databook',
      'Cartas'
    ],
    activeCategory: 'Todos',
    query: '',
    sort: 'name-asc',
    platform: '',
    achievements: [],
    unlockedAchievements: []
  }

  // Sistema de Conquistas
  const achievements = [
    {
      id: 'ps1_collector',
      title: 'Colecionador PS1',
      description: 'Colete todos os jogos de PS1',
      icon: '🎮',
      check: () => {
        const ps1Games = state.items.filter(i => i.platform === 'PS1' && i.category === 'Jogos')
        const ownedPs1 = ps1Games.filter(i => i.owned)
        return ps1Games.length > 0 && ownedPs1.length === ps1Games.length
      }
    },
    {
      id: 'ps2_collector',
      title: 'Colecionador PS2',
      description: 'Colete todos os jogos de PS2',
      icon: '🎮',
      check: () => {
        const ps2Games = state.items.filter(i => i.platform === 'PS2' && i.category === 'Jogos')
        const ownedPs2 = ps2Games.filter(i => i.owned)
        return ps2Games.length > 0 && ownedPs2.length === ps2Games.length
      }
    },
    {
      id: 'ff7r_lottery_f',
      title: 'Colecionador de Toalhas',
      description: 'Colete todos os Prêmios F da Loteria FFVII Remake',
      icon: '🏆',
      check: () => {
        const prizeF = state.items.filter(i => 
          i.category === 'Loteria Final Fantasy VII Remake' && 
          /Prêmio F:/i.test(i.name || '')
        )
        const ownedF = prizeF.filter(i => i.owned)
        return prizeF.length > 0 && ownedF.length === prizeF.length
      }
    },
    {
      id: 'ff16_lottery_b',
      title: 'Mestre dos Eikons',
      description: 'Colete todos os Prêmios B da Loteria FFXVI',
      icon: '🔥',
      check: () => {
        const prizeB = state.items.filter(i => 
          i.category === 'Loteria Final Fantasy XVI' && 
          /Prêmio B:/i.test(i.name || '')
        )
        const ownedB = prizeB.filter(i => i.owned)
        return prizeB.length > 0 && ownedB.length === prizeB.length
      }
    },
    {
      id: 'music_box_collector',
      title: 'Maestro das Melodias',
      description: 'Colete todas as Music Boxes',
      icon: '🎶',
      check: () => {
        const musicBoxes = state.items.filter(i => i.category === 'Music Box')
        const ownedBoxes = musicBoxes.filter(i => i.owned)
        return musicBoxes.length > 0 && ownedBoxes.length === musicBoxes.length
      }
    },
    {
      id: 'ultimania_collector',
      title: 'Estudioso de Ultimania',
      description: 'Colete todos os volumes do Ultimania Archive',
      icon: '📚',
      check: () => {
        const ultimanias = state.items.filter(i => 
          i.category === 'Artbook/Databook' && 
          /Ultimania Archive Vol\./i.test(i.name || '')
        )
        const ownedUltimanias = ultimanias.filter(i => i.owned)
        return ultimanias.length > 0 && ownedUltimanias.length === ultimanias.length
      }
    },
    {
      id: 'rarity_5_collector',
      title: 'Caçador de Raridades',
      description: 'Colete 10 itens de raridade 5',
      icon: '⭐',
      check: () => {
        const rarity5Items = state.items.filter(i => (i.rarity || 0) === 5 && i.owned)
        return rarity5Items.length >= 10
      }
    },
    {
      id: 'first_steps',
      title: 'Primeiros Passos',
      description: 'Marque seu primeiro item como coletado',
      icon: '🌟',
      check: () => {
        const ownedItems = state.items.filter(i => i.owned)
        return ownedItems.length >= 1
      }
    },
    {
      id: 'collector_milestone_50',
      title: 'Colecionador Dedicado',
      description: 'Colete 50 itens',
      icon: '🏅',
      check: () => {
        const ownedItems = state.items.filter(i => i.owned)
        return ownedItems.length >= 50
      }
    },
    {
      id: 'ff9_lottery_complete',
      title: 'Memórias de Alexandria',
      description: 'Complete toda a Loteria Final Fantasy IX',
      icon: '👑',
      check: () => {
        const ff9Items = state.items.filter(i => i.category === 'Loteria Final Fantasy IX')
        const ownedFF9 = ff9Items.filter(i => i.owned)
        return ff9Items.length > 0 && ownedFF9.length === ff9Items.length
      }
    }
  ]

  function checkAchievements() {
    const newlyUnlocked = []
    
    achievements.forEach(achievement => {
      const isUnlocked = state.unlockedAchievements.includes(achievement.id)
      const shouldUnlock = achievement.check()
      
      if (shouldUnlock && !isUnlocked) {
        state.unlockedAchievements.push(achievement.id)
        newlyUnlocked.push(achievement)
      }
    })
    
    if (newlyUnlocked.length > 0) {
      saveAchievements()
      showAchievementNotifications(newlyUnlocked)
    }
  }

  function showAchievementNotifications(achievements) {
    achievements.forEach((achievement, index) => {
      setTimeout(() => {
        showAchievementToast(achievement)
      }, index * 1000)
    })
  }

  function showAchievementToast(achievement) {
    const toast = document.createElement('div')
    toast.className = 'achievement-toast'
    toast.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-content">
        <div class="achievement-title">Conquista Desbloqueada!</div>
        <div class="achievement-name">${achievement.title}</div>
        <div class="achievement-desc">${achievement.description}</div>
      </div>
    `
    
    document.body.appendChild(toast)
    
    // Animação de entrada
    setTimeout(() => toast.classList.add('show'), 100)
    
    // Remover após 5 segundos
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => toast.remove(), 300)
    }, 5000)
  }

  // Helpers
  function prizeLevel(item){
    if (!item || !item.name) return ''
    // Apenas para categorias de loteria
    const isLottery = /^Loteria /.test(item.category || '')
    if (!isLottery) return ''
    const name = String(item.name)
    // Prêmio Raro / End Prize
    if (/Pr[eê]mio\s+Raro/i.test(name) || /End\s*Prize/i.test(name)) return 'End'
    // Prêmio/Prêmios A-G
    const m = name.match(/^Pr[eê]m(i|í)o?s?\s+([A-G]):/i)
    return m ? `Prêmio ${m[2].toUpperCase()}` : ''
  }

  function ffxviPrizeBDesign(item){
    // Badge opcional para identificar o "design" nos itens da Loteria FFXVI prêmio B
    if (!item || !item.name || item.category !== 'Loteria Final Fantasy XVI') return ''
    const m = String(item.name).match(/^Pr[eê]mio\s+B:\s*Figure Collection\s+—\s*(.+)$/i)
    return m ? m[1] : ''
  }

  // Inicialização
  document.addEventListener('DOMContentLoaded', () => {
    state.items = loadItems() || sampleData()
    // Garantir createdAt para ordenar "últimos com foto"
    const now = Date.now()
    state.items.forEach((it, idx) => { if (!it.createdAt) it.createdAt = now - idx * 1000 })
    // Próximo ID baseado no maior existente
    state.nextId = state.items.reduce((m,i)=> Math.max(m, i.id||0), 0) + 1
    // Carregar conquistas
    state.unlockedAchievements = loadAchievements()
    // Migrar: adicionar flag owned (coletado) inferida da existência de imagem, se ainda não houver
    let migratedOwned = false
    state.items.forEach(it => {
      if (typeof it.owned === 'undefined') { it.owned = !!it.image; migratedOwned = true }
    })
    if (migratedOwned) { saveItems() }
    // Migração única: apagar todas as fotos existentes
    const MIGRATION_WIPE_PHOTOS_KEY = 'ifritInventory.wipePhotos.m1'
    if (!localStorage.getItem(MIGRATION_WIPE_PHOTOS_KEY)){
      let changed = false
      state.items.forEach(it => { if (it && it.image){ delete it.image; changed = true } })
      if (changed){ saveItems() }
      try{ localStorage.setItem(MIGRATION_WIPE_PHOTOS_KEY, '1') }catch(e){}
    }
    // Migração: renomear categoria Artbooks -> Artbook/Databook e semear Ultimania Vol. 2 e 3
    (function migrateAndSeed(){
      let changed = false
      state.items.forEach(it => {
        if (it && it.category === 'Artbooks') { it.category = 'Artbook/Databook'; changed = true }
      })
      const ensureItem = (name) => {
        const exists = state.items.some(i => (i.name||'').toLowerCase() === name.toLowerCase())
        if (!exists){
          state.items.push({ id: ++state.nextId, name, category: 'Artbook/Databook', rarity: 0 })
          changed = true
        }
      }
      ensureItem('Final Fantasy Ultimania Archive Vol. 2')
      ensureItem('Final Fantasy Ultimania Archive Vol. 3')
      if (changed){ saveItems() }
    })()
    bindUI()
    renderCategories()
    prepareAddModal()
    applyFilters()
    renderAchievements()
    // Verificar conquistas iniciais (sem notificações)
    checkAchievements()
  })

  // Renderizar seção de conquistas
  function renderAchievements() {
    const achievementsSection = document.getElementById('achievementsSection')
    if (!achievementsSection) return

    const unlockedCount = state.unlockedAchievements.length
    const totalCount = achievements.length
    const progressPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

    const achievementCards = achievements.map(achievement => {
      const isUnlocked = state.unlockedAchievements.includes(achievement.id)
      const progress = getAchievementProgress(achievement)
      
      return `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-icon">${achievement.icon}</div>
          <div class="achievement-info">
            <div class="achievement-title">${achievement.title}</div>
            <div class="achievement-desc">${achievement.description}</div>
            ${progress ? `<div class="achievement-progress">${progress}</div>` : ''}
          </div>
          ${isUnlocked ? '<div class="achievement-badge">✓</div>' : ''}
        </div>
      `
    }).join('')

    achievementsSection.innerHTML = `
      <div class="achievements-header">
        <h3>Conquistas</h3>
        <div class="achievements-progress">
          <span>${unlockedCount}/${totalCount} desbloqueadas (${progressPct}%)</span>
          <div class="progress">
            <span style="width: ${progressPct}%"></span>
          </div>
        </div>
      </div>
      <div class="achievements-grid">
        ${achievementCards}
      </div>
    `
  }

  function getAchievementProgress(achievement) {
    switch(achievement.id) {
      case 'ps1_collector': {
        const ps1Games = state.items.filter(i => i.platform === 'PS1' && i.category === 'Jogos')
        const owned = ps1Games.filter(i => i.owned).length
        return ps1Games.length > 0 ? `${owned}/${ps1Games.length} jogos PS1` : null
      }
      case 'ps2_collector': {
        const ps2Games = state.items.filter(i => i.platform === 'PS2' && i.category === 'Jogos')
        const owned = ps2Games.filter(i => i.owned).length
        return ps2Games.length > 0 ? `${owned}/${ps2Games.length} jogos PS2` : null
      }
      case 'ff7r_lottery_f': {
        const prizeF = state.items.filter(i => 
          i.category === 'Loteria Final Fantasy VII Remake' && 
          /Prêmio F:/i.test(i.name || '')
        )
        const owned = prizeF.filter(i => i.owned).length
        return prizeF.length > 0 ? `${owned}/${prizeF.length} Prêmios F` : null
      }
      case 'ff16_lottery_b': {
        const prizeB = state.items.filter(i => 
          i.category === 'Loteria Final Fantasy XVI' && 
          /Prêmio B:/i.test(i.name || '')
        )
        const owned = prizeB.filter(i => i.owned).length
        return prizeB.length > 0 ? `${owned}/${prizeB.length} Prêmios B` : null
      }
      case 'music_box_collector': {
        const musicBoxes = state.items.filter(i => i.category === 'Music Box')
        const owned = musicBoxes.filter(i => i.owned).length
        return musicBoxes.length > 0 ? `${owned}/${musicBoxes.length} Music Boxes` : null
      }
      case 'ultimania_collector': {
        const ultimanias = state.items.filter(i => 
          i.category === 'Artbook/Databook' && 
          /Ultimania Archive Vol\./i.test(i.name || '')
        )
        const owned = ultimanias.filter(i => i.owned).length
        return ultimanias.length > 0 ? `${owned}/${ultimanias.length} volumes Ultimania` : null
      }
      case 'rarity_5_collector': {
        const rarity5Items = state.items.filter(i => (i.rarity || 0) === 5 && i.owned)
        return `${rarity5Items.length}/10 itens raridade 5`
      }
      case 'first_steps': {
        const ownedItems = state.items.filter(i => i.owned)
        return `${Math.min(ownedItems.length, 1)}/1 item coletado`
      }
      case 'collector_milestone_50': {
        const ownedItems = state.items.filter(i => i.owned)
        return `${ownedItems.length}/50 itens coletados`
      }
      case 'ff9_lottery_complete': {
        const ff9Items = state.items.filter(i => i.category === 'Loteria Final Fantasy IX')
        const owned = ff9Items.filter(i => i.owned).length
        return ff9Items.length > 0 ? `${owned}/${ff9Items.length} itens FFIX` : null
      }
      default:
        return null
    }
  }

  // UI bindings
  function bindUI(){
    const search = document.getElementById('searchInput')
    const sort = document.getElementById('sortSelect')
    const platform = document.getElementById('platformFilter')
    const addBtn = document.getElementById('addItemBtn')

    search.addEventListener('input', e => { state.query = e.target.value.trim().toLowerCase(); applyFilters() })
    sort.addEventListener('change', e => { state.sort = e.target.value; applyFilters() })
    platform.addEventListener('change', e => { state.platform = e.target.value; applyFilters() })
    if (addBtn) addBtn.addEventListener('click', () => {
      const cat = state.activeCategory !== 'Todos' ? state.activeCategory : ''
      openAddModal({ category: cat })
    })

    // Backup: Exportar / Importar
    const exportBtn = document.getElementById('exportBtn')
    if (exportBtn){
      exportBtn.addEventListener('click', () => exportItems())
    }
    const importInput = document.getElementById('importInput')
    if (importInput){
      importInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        try{
          await importItemsFromFile(file)
          alert('Importação concluída.')
        }catch(err){
          console.error(err)
          alert('Falha ao importar: ' + (err.message||err))
        }finally{
          importInput.value = ''
        }
      })
    }

    // Botão Colar JSON (clipboard)
    const pasteBtn = document.getElementById('pasteImportBtn')
    if (pasteBtn){
      pasteBtn.addEventListener('click', async () => {
        try{
          if (!navigator.clipboard){
            alert('Clipboard API indisponível neste navegador.')
            return
          }
          const text = await navigator.clipboard.readText()
          if (!text || !text.trim()){
            alert('A área de transferência está vazia ou não contém texto.')
            return
          }
          await importItemsFromText(text)
          alert('Importação via clipboard concluída.')
        }catch(err){
          console.error(err)
          alert('Falha ao importar do clipboard: ' + (err.message||err))
        }
      })
    }

    // Drag & Drop em toda a página, com destaque na barra de backup
    const dropZone = document.querySelector('.backup-bar') || document.body
    ;['dragenter','dragover'].forEach(evt => {
      document.addEventListener(evt, (e) => {
        e.preventDefault(); e.stopPropagation()
        if (dropZone && dropZone.classList) dropZone.classList.add('dragover')
      })
    })
    ;['dragleave','drop'].forEach(evt => {
      document.addEventListener(evt, (e) => {
        e.preventDefault(); e.stopPropagation()
        if (dropZone && dropZone.classList) dropZone.classList.remove('dragover')
      })
    })
    document.addEventListener('drop', async (e) => {
      const files = e.dataTransfer && e.dataTransfer.files
      if (!files || !files.length) return
      const file = files[0]
      if (!/\.json$/i.test(file.name)){
        alert('Solte um arquivo .json para importar.')
        return
      }
      try{
        await importItemsFromFile(file)
        alert('Importação via arrastar-soltar concluída.')
      }catch(err){
        console.error(err)
        alert('Falha ao importar (drop): ' + (err.message||err))
      }
    })

    // Restaurar banco (padrão)
    const resetBtn = document.getElementById('resetDbBtn')
    if (resetBtn){
      resetBtn.addEventListener('click', () => resetDatabase())
    }
  }

  // Categorias
  function renderCategories(){
    const nav = document.getElementById('categoryList')
    nav.innerHTML = ''
    state.categories.forEach(cat => {
      const btn = document.createElement('button')
      btn.textContent = cat
      btn.className = cat === state.activeCategory ? 'active' : ''
      btn.addEventListener('click', () => {
        state.activeCategory = cat
        document.querySelectorAll('#categoryList button').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        applyFilters()
      })
      nav.appendChild(btn)
    })
  }

  // Filtro + Ordenação
  function applyFilters(){
    let data = [...state.items]

    if (state.activeCategory !== 'Todos') {
      data = data.filter(i => i.category === state.activeCategory)
    }
    if (state.query) {
      const q = state.query
      data = data.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.platform || '').toLowerCase().includes(q) ||
        (i.notes || '').toLowerCase().includes(q)
      )
    }
    if (state.platform) {
      data = data.filter(i => (i.platform || '') === state.platform)
    }

    // Ordenação
    const [field, dir] = state.sort.split('-')
    data.sort((a,b) => {
      const s = (v) => (v===undefined||v===null)?'':v
      let x, y
      switch(field){
        case 'name': x = s(a.name).toLowerCase(); y = s(b.name).toLowerCase(); break
        case 'year': x = s(a.year)||0; y = s(b.year)||0; break
        case 'rarity': x = s(a.rarity)||0; y = s(b.rarity)||0; break
        case 'lottery':
          x = a.lotteryOrder !== undefined ? a.lotteryOrder : 9999;
          y = b.lotteryOrder !== undefined ? b.lotteryOrder : 9999;
          break
        default: x = 0; y = 0
      }
      if (x<y) return dir==='asc' ? -1 : 1
      if (x>y) return dir==='asc' ? 1 : -1
      return 0
    })

    state.filtered = data
    renderStats()
    renderLotteryDashboard()
    renderLatestGallery()
    renderGrid()
  }

  // KPIs
  function renderStats(){
    const el = document.getElementById('statsBar')
    // Todas as contagens consideram apenas itens marcados como coletados
    const owned = state.filtered.filter(i => !!i.owned)
    const total = owned.length
    const avgRarity = owned.length
      ? (owned.reduce((s,i)=> s + (i.rarity||0), 0) / owned.length)
      : 0
    const cats = new Set(owned.map(i => i.category))

    el.innerHTML = `
      <div class="stat">
        <div class="label">Itens</div>
        <div class="value">${total}</div>
      </div>
      <div class="stat">
        <div class="label">Raridade média</div>
        <div class="value">${avgRarity.toFixed(1)} / 5</div>
      </div>
      <div class="stat">
        <div class="label">Categorias visíveis</div>
        <div class="value">${cats.size}</div>
      </div>
    `
  }

  // Dashboard de Loterias
  function renderLotteryDashboard(){
    const wrap = document.getElementById('lotteryDashboard')
    if (!wrap) return
    // Considera todas as loterias do estado completo, não apenas filtradas
    const categories = Array.from(new Set(state.items
      .filter(i => /^Loteria /.test(i.category||'') || (i.category||'') === 'Music Box')
      .map(i => i.category)))

    if (!categories.length){ wrap.innerHTML = ''; return }

    const cards = categories.map(cat => {
      const items = state.items.filter(i => i.category === cat)
      const withOrder = items.filter(i => typeof i.lotteryOrder === 'number')
      const expected = withOrder.length ? Math.max(...withOrder.map(i => i.lotteryOrder||0)) : items.length
      // Coletados contam itens marcados como owned
      let collected
      if (withOrder.length){
        const distinctOwned = new Set(withOrder.filter(i => !!i.owned).map(i => i.lotteryOrder))
        collected = distinctOwned.size
      } else {
        collected = items.filter(i => !!i.owned).length
      }
      const pct = expected ? Math.min(100, Math.round((collected/expected)*100)) : 0
      return `
        <div class="dash-card">
          <div class="dash-title">${cat}</div>
          <div class="dash-row"><span>Completos</span><span class="dash-val">${collected} / ${expected} — ${pct}%</span></div>
          <div class="progress" aria-label="Progresso ${pct}%"><span style="width:${pct}%"></span></div>
        </div>
      `
    })
    wrap.innerHTML = cards.join('')
  }

  // Lista (modo padrão)
  function renderGrid(){
    const grid = document.getElementById('itemsGrid')
    const empty = document.getElementById('emptyState')

    // Forçar modo lista no container
    if (grid.classList.contains('grid')) grid.classList.remove('grid')
    grid.classList.add('list')

    grid.innerHTML = ''
    if (!state.filtered.length){
      empty.hidden = false
      return
    }
    empty.hidden = true

    state.filtered.forEach(item => grid.appendChild(listRow(item)))
  }

  function listRow(item){
    const el = document.createElement('article')
    el.className = 'list-item'

    const rarityStars = '★★★★★☆☆☆☆☆'.slice(5 - (item.rarity||0), 10 - (item.rarity||0))
    const platformBadge = item.platform ? `<span class="badge">${item.platform}</span>` : ''
    const prize = prizeLevel(item)
    const tierClass = prize
      ? (prize.toLowerCase() === 'end'
          ? 'tier-end'
          : (/^pr[eê]mio\s+([a-g])/i.test(prize) ? `tier-${prize.replace(/^Pr[eê]mio\s+/i,'').charAt(0).toLowerCase()}` : ''))
      : ''
    const prizeBadge = prize ? `<span class="badge prize ${tierClass}">${prize}</span>` : ''
    const design = ffxviPrizeBDesign(item)
    const designBadge = design ? `<span class="badge design">${design}</span>` : ''
    const thumbContent = item.image
      ? `<img src="${item.image}" alt="${escapeAttr(item.name)}" />`
      : thumbIcon(item.category)

    el.innerHTML = `
      <div class="main">
        <label class="check">
          <input type="checkbox" ${item.owned ? 'checked' : ''} aria-label="Marcar como na coleção" />
        </label>
        <div class="thumb">${thumbContent}</div>
        <div class="info">
          <div class="title">${item.name}</div>
          <div class="badges">
            <span class="badge brand">${item.category}</span>
            ${prizeBadge}
            ${designBadge}
            ${platformBadge}
          </div>
        </div>
        <div class="meta-small">${item.rarity||0}/5 • ${rarityStars}</div>
      </div>
      <div class="details">
        ${item.notes ? `<div class="meta">${item.notes}</div>` : ''}
        ${item.year ? `<div class="meta">Ano: ${item.year}</div>` : ''}
        <div class="actions">
          <button title="Cadastrar item" class="row-btn" data-action="add"><i class="fa-solid fa-plus"></i> Cadastrar item</button>
          <button title="Excluir item" class="row-btn danger" data-action="del"><i class="fa-solid fa-trash"></i> Excluir</button>
        </div>
      </div>
    `

    const checkbox = el.querySelector('input[type="checkbox"]')
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation()
    })
    checkbox.addEventListener('change', () => {
      item.owned = !!checkbox.checked
      saveItems()
      renderStats()
      renderLotteryDashboard()
      renderAchievements()
      checkAchievements()
    })

    el.addEventListener('click', (e) => {
      // Ignorar cliques em botões internos
      const target = e.target
      if (target.closest && target.closest('button, input, label.check')) return
      el.classList.toggle('open')
    })

    const onAction = (action) => {
      if (action === 'add'){
        openAddModal({ name: item.name, category: item.category })
      } else if (action === 'del'){
        deleteItem(item.id)
      }
    }
    el.querySelectorAll('.row-btn').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation()
        onAction(btn.getAttribute('data-action'))
      })
    })

    return el
  }

  // Últimos com foto
  function renderLatestGallery(){
    const el = document.getElementById('latestGallery')
    if (!el) return
    const latest = state.items
      .filter(i => !!i.image)
      .slice()
      .sort((a,b)=> (b.createdAt||0) - (a.createdAt||0))
      .slice(0, 10)
    if (!latest.length){ el.innerHTML = ''; return }
    el.innerHTML = latest.map(i => `
      <a class="latest-item" title="${escapeAttr(i.name)}">
        <img loading="lazy" src="${i.image}" alt="${escapeAttr(i.name)}" />
      </a>
    `).join('')
  }

  function card(item){
    const el = document.createElement('article')
    el.className = 'card'

    const rarityStars = '★★★★★☆☆☆☆☆'.slice(5 - (item.rarity||0), 10 - (item.rarity||0))
    const platformBadge = item.platform ? `<span class="badge">${item.platform}</span>` : ''
    const prize = prizeLevel(item)
    const tierClass = prize
      ? (prize.toLowerCase() === 'end'
          ? 'tier-end'
          : (/^pr[eê]mio\s+([a-g])/i.test(prize) ? `tier-${prize.replace(/^Pr[eê]mio\s+/i,'').charAt(0).toLowerCase()}` : ''))
      : ''
    const prizeBadge = prize ? `<span class="badge prize ${tierClass}">${prize}</span>` : ''
    const design = ffxviPrizeBDesign(item)
    const designBadge = design ? `<span class="badge design">${design}</span>` : ''
    const thumbContent = item.image
      ? `<img src="${item.image}" alt="${escapeAttr(item.name)}" />`
      : thumbIcon(item.category)

    el.innerHTML = `
      <div class="thumb">${thumbContent}</div>
      <div class="body">
        <div class="badges">
          <span class="badge brand">${item.category}</span>
          ${prizeBadge}
          ${designBadge}
          ${platformBadge}
        </div>
        <div class="title">${item.name}</div>
        <div class="meta">Raridade: ${item.rarity||0}/5 • ${rarityStars}</div>
        ${item.notes ? `<div class="meta">${item.notes}</div>` : ''}
      </div>
      <div class="footer">
        <button title="Cadastrar item" onclick="openAddModal({name: '${escapeAttr(item.name)}', category: '${escapeAttr(item.category)}'})">
          <i class="fa-solid fa-plus"></i> Cadastrar item
        </button>
        <button title="Excluir item" onclick="deleteItem(${item.id})">
          <i class="fa-solid fa-trash"></i> Excluir
        </button>
      </div>
    `
    return el
  }

  // Helpers
  function thumbIcon(category){
    switch(category){
      case 'Jogos': return '🎮'
      case 'Livros': return '📚'
      case 'Trilhas Sonoras': return '🎵'
      case 'Music Box': return '🎶'
      case 'Merch': return '🧢'
      case 'Artbook/Databook': return '🖼️'
      case 'Cartas': return '🃏'
      case 'Loteria Final Fantasy VII Remake': return '🎟️'
      case 'Loteria Final Fantasy IX': return '🎟️'
      case 'Loteria Final Fantasy XVI': return '🎟️'
      default: return '🔥'
    }
  }
  function escapeAttr(str){
    return String(str).replace(/["'\\\n]/g, s => ({'"':'&quot;','\'':'&#39;','\\':'\\\\','\n':'\\n'}[s]))
  }

  function deleteItem(id){
    const item = state.items.find(i => i.id === id)
    const ok = confirm(item ? `Excluir "${item.name}"?` : 'Excluir item?')
    if (!ok) return
    const before = state.items.length
    state.items = state.items.filter(i => i.id !== id)
    if (state.items.length !== before){
      saveItems()
      applyFilters()
    }
  }
  window.deleteItem = deleteItem

  // ----- Adicionar Item -----
  function prepareAddModal(){
    const modal = document.getElementById('addItemModal')
    if (!modal) return

    const form = document.getElementById('addItemForm')
    const closeBtn = document.getElementById('closeAddModal')
    const cancelBtn = document.getElementById('cancelAddBtn')
    const imageInput = document.getElementById('imageInput')
    const preview = document.getElementById('imagePreview')
    const catSelect = document.getElementById('addCategory')
    const nameInput = form ? form.querySelector('input[name="name"]') : null

    // Preenche categorias (sem 'Todos')
    if (catSelect){
      catSelect.innerHTML = state.categories
        .filter(c => c !== 'Todos')
        .map(c => `<option value="${c}">${c}</option>`)
        .join('')
    }

    let currentImageData = ''
    let defaultValues = { name: '', category: '' }

    function resetForm(){
      if (form) form.reset()
      currentImageData = ''
      if (preview) preview.innerHTML = '<i class="fa-regular fa-image"></i>'
    }
    function show(){
      modal.hidden = false; modal.setAttribute('aria-hidden','false')
      if (nameInput) nameInput.value = defaultValues.name || ''
      if (catSelect){
        const preferred = defaultValues.category || (state.activeCategory !== 'Todos' ? state.activeCategory : '')
        if (preferred) catSelect.value = preferred
      }
      if (nameInput) nameInput.focus()
    }
    function hide(){ modal.hidden = true; modal.setAttribute('aria-hidden','true'); resetForm() }
    function onClose(){ hide() }

    if (closeBtn) closeBtn.addEventListener('click', onClose)
    if (cancelBtn) cancelBtn.addEventListener('click', onClose)

    if (imageInput){
      imageInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0]
        if (!file) { currentImageData = ''; if (preview) preview.innerHTML = '<i class="fa-regular fa-image"></i>'; return }
        const reader = new FileReader()
        reader.onload = () => {
          currentImageData = reader.result
          if (preview) preview.innerHTML = `<img src="${currentImageData}" alt="preview" />`
        }
        reader.readAsDataURL(file)
      })
    }

    if (form){
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        const fd = new FormData(form)
        const item = {
          id: state.nextId++,
          name: (fd.get('name')||'').toString().trim(),
          category: (fd.get('category')||'').toString(),
          rarity: fd.get('rarity') ? Math.max(0, Math.min(5, Number(fd.get('rarity')))) : 0,
          notes: (fd.get('notes')||'').toString().trim() || undefined,
          image: currentImageData || undefined,
          owned: !!currentImageData,
          createdAt: Date.now(),
        }
        if (!item.name || !item.category){
          alert('Preencha ao menos Nome e Categoria.')
          return
        }
        state.items.unshift(item)
        saveItems()
        // Ajustar categoria ativa para mostrar o item recém adicionado
        if (state.activeCategory !== 'Todos' && state.activeCategory !== item.category){
          state.activeCategory = item.category
          renderCategories()
        }
        applyFilters()
        renderAchievements()
        checkAchievements()
        hide()
      })
    }

    // Expor para handlers
    window.openAddModal = (opts = {}) => {
      defaultValues = {
        name: (opts.name || '').toString(),
        category: (opts.category || '').toString(),
      }
      show()
    }
  }

  function openAddModal(){ if (window.openAddModal) window.openAddModal() }

  // Persistência local
  const STORAGE_KEY = 'ifritInventory.items'
  const ACHIEVEMENTS_KEY = 'ifritInventory.achievements'
  
  function loadItems(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
      return null
    }catch(e){ return null }
  }
  
  function saveItems(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    }catch(e){ /* ignore quota errors */ }
  }
  
  function loadAchievements(){
    try{
      const raw = localStorage.getItem(ACHIEVEMENTS_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
      return []
    }catch(e){ return [] }
  }
  
  function saveAchievements(){
    try{
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(state.unlockedAchievements))
    }catch(e){ /* ignore quota errors */ }
  }

  // Backup/export/import
  function exportItems(){
    const data = JSON.stringify(state.items, null, 2)
    const blob = new Blob([data], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const ts = new Date().toISOString().replace(/[:.]/g,'-')
    a.href = url
    a.download = `ifrit-inventory-backup-${ts}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  async function importItemsFromFile(file){
    const text = await file.text()
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error('Invalid JSON format')
    // opcional: validação leve
    const now = Date.now()
    state.items = parsed.map((it, idx) => ({ ...it, createdAt: it.createdAt || (now - idx*1000) }))
    state.nextId = state.items.reduce((m,i)=> Math.max(m, i.id||0), 0) + 1
    saveItems()
    renderCategories()
    applyFilters()
  }

  async function importItemsFromText(text){
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error('Invalid JSON format')
    const now = Date.now()
    state.items = parsed.map((it, idx) => ({ ...it, createdAt: it.createdAt || (now - idx*1000) }))
    state.nextId = state.items.reduce((m,i)=> Math.max(m, i.id||0), 0) + 1
    saveItems()
    renderCategories()
    applyFilters()
  }

  // Restaurar banco para os dados de exemplo
  function resetDatabase(){
    const ok = confirm('Atualizar os dados para o padrão? Isso substituirá os itens atuais.')
    if (!ok) return
    state.items = sampleData()
    state.nextId = state.items.reduce((m,i)=> Math.max(m, i.id||0), 0) + 1
    saveItems()
    renderCategories()
    applyFilters()
    alert('Atualização concluída!')
  }

  // Dados de exemplo
  function sampleData(){
    let id = 1
    const next = () => id++
    return [
      { id: next(), name: 'Final Fantasy VII (PS1) Black Label', category: 'Jogos', platform: 'PS1', year: 1997, rarity: 4, notes: 'Completo, manual incluso' },
      { id: next(), name: 'Final Fantasy VIII (PS1)', category: 'Jogos', platform: 'PS1', year: 1999, rarity: 3, notes: 'Lacrado, selo original' },
      { id: next(), name: 'Final Fantasy IX (PS1)', category: 'Jogos', platform: 'PS1', year: 2000, rarity: 3 },
      { id: next(), name: 'Final Fantasy X (PS2)', category: 'Jogos', platform: 'PS2', year: 2001, rarity: 2 },
      { id: next(), name: 'Final Fantasy XII Steelbook (PS2)', category: 'Jogos', platform: 'PS2', year: 2006, rarity: 3 },
      { id: next(), name: 'Final Fantasy XIII Lightning Returns (PS3)', category: 'Jogos', platform: 'PS3', year: 2013, rarity: 2 },
      { id: next(), name: 'Final Fantasy XV Royal Edition (PS4)', category: 'Jogos', platform: 'PS4', year: 2018, rarity: 2 },
      { id: next(), name: 'Final Fantasy VII Remake Deluxe (PS4)', category: 'Jogos', platform: 'PS4', year: 2020, rarity: 4, notes: 'Com artbook e trilha' },
      { id: next(), name: 'Final Fantasy VII Rebirth (PS5)', category: 'Jogos', platform: 'PS5', year: 2024, rarity: 4 },
      { id: next(), name: 'Final Fantasy XVI Deluxe (PS5)', category: 'Jogos', platform: 'PS5', year: 2023, rarity: 4 },

      { id: next(), name: 'Dicionário de Lore — FF Compendium', category: 'Livros', platform: 'Livro', year: 2016, rarity: 3 },
      { id: next(), name: 'Final Fantasy Ultimania Archive Vol. 1', category: 'Artbook/Databook', platform: 'Livro', year: 2018, rarity: 4 },
      { id: next(), name: 'Final Fantasy Ultimania Archive Vol. 2', category: 'Artbook/Databook', platform: 'Livro', rarity: 0 },
      { id: next(), name: 'Final Fantasy Ultimania Archive Vol. 3', category: 'Artbook/Databook', platform: 'Livro', rarity: 0 },
      { id: next(), name: 'Final Fantasy VII Remake Material Ultimania', category: 'Artbook/Databook', platform: 'Livro', year: 2020, rarity: 5 },

      { id: next(), name: 'OST Final Fantasy VII Vinyl', category: 'Trilhas Sonoras', platform: 'Merch', year: 2019, rarity: 4 },
      { id: next(), name: 'FFXIV Shadowbringers OST', category: 'Trilhas Sonoras', platform: 'Merch', year: 2019, rarity: 3 },

      // Loteria Final Fantasy VII Remake — todos os itens na ordem
      { id: next(), name: 'Prêmio A: Figura de Cloud Strife', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 5, lotteryOrder: 1 },
      { id: next(), name: 'Prêmio B: Figura de Aerith Gainsborough', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 5, lotteryOrder: 2 },
      { id: next(), name: 'Prêmio B: Livro-guia turístico de Midgar', category: 'Loteria Final Fantasy VII Remake', platform: 'Livro', year: 2020, rarity: 4, lotteryOrder: 3 },
      { id: next(), name: 'Prêmio C: Pelúcia de Moogle', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 4, lotteryOrder: 4 },
      { id: next(), name: 'Prêmios D: Pin badges (pacotes surpresa)', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 3, lotteryOrder: 5 },
      { id: next(), name: 'Prêmio E: Copo de vidro — Cloud', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 2, lotteryOrder: 6 },
      { id: next(), name: 'Prêmio E: Copo de vidro — Tifa', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 2, lotteryOrder: 7 },
      { id: next(), name: 'Prêmio E: Copo de vidro — Shinra', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 2, lotteryOrder: 8 },
      { id: next(), name: 'Prêmio E: Copo de vidro — Buster Sword', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 2, lotteryOrder: 9 },
      { id: next(), name: 'Prêmio E: Copo de vidro — Meteor', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 2, lotteryOrder: 10 },
      { id: next(), name: 'Prêmio F: Toalha de mão — Modelo 1', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 1, lotteryOrder: 11 },
      { id: next(), name: 'Prêmio F: Toalha de mão — Modelo 2', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 1, lotteryOrder: 12 },
      { id: next(), name: 'Prêmio F: Toalha de mão — Modelo 3', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 1, lotteryOrder: 13 },
      { id: next(), name: 'Prêmio F: Toalha de mão — Modelo 4', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 1, lotteryOrder: 14 },
      { id: next(), name: 'Prêmios G: Mini-figurinas retrô poligonais (pacote surpresa)', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 1, lotteryOrder: 15 },
      { id: next(), name: 'Prêmio Raro (End Prize): Figura de Sephiroth', category: 'Loteria Final Fantasy VII Remake', platform: 'Merch', year: 2020, rarity: 5, lotteryOrder: 16, notes: 'End Prize — referência: aitaikuji.com' },

      // Loteria Final Fantasy XVI — todos os itens na ordem
      { id: next(), name: 'Prêmio A: Figure (1 design)', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 5, lotteryOrder: 1 },
      // Prêmio B separado por designs (8)
      { id: next(), name: 'Prêmio B: Figure Collection — Ifrit', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 4, lotteryOrder: 2 },
      { id: next(), name: 'Prêmio B: Figure Collection — Phoenix', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 4, lotteryOrder: 3 },
      { id: next(), name: 'Prêmio B: Figure Collection — Shiva', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 4, lotteryOrder: 4 },
      { id: next(), name: 'Prêmio B: Figure Collection — Ramuh', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 4, lotteryOrder: 5 },
      { id: next(), name: 'Prêmio B: Figure Collection — Garuda', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 4, lotteryOrder: 6 },
      { id: next(), name: 'Prêmio B: Figure Collection — Titan', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 4, lotteryOrder: 7 },
      { id: next(), name: 'Prêmio B: Figure Collection — Bahamut', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 4, lotteryOrder: 8 },
      { id: next(), name: 'Prêmio B: Figure Collection — Odin', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 4, lotteryOrder: 9 },
      // Demais prêmios, ordens ajustadas
      { id: next(), name: 'Prêmio C: Glass Collection (1 par)', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 3, lotteryOrder: 10 },
      { id: next(), name: 'Prêmio D: Coaster Collection (5 designs)', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 3, lotteryOrder: 11 },
      { id: next(), name: 'Prêmio E: Acrylic Stand (3 designs)', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 2, lotteryOrder: 12 },
      { id: next(), name: 'Prêmio F: Magnets (8 designs)', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 2, lotteryOrder: 13 },
      { id: next(), name: 'Prêmio G: Visual Clear Mat (3 designs)', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 1, lotteryOrder: 14 },
      { id: next(), name: 'Prêmio Last: Shiva Silver Figure', category: 'Loteria Final Fantasy XVI', platform: 'Merch', year: 2023, rarity: 5, lotteryOrder: 15 },

      // Loteria Final Fantasy IX — baseado em GoNintendo (2025-07-07)
      { id: next(), name: 'Prêmio A: Pelúcia do Vivi (50 cm)', category: 'Loteria Final Fantasy IX', platform: 'Merch', year: 2025, rarity: 5, lotteryOrder: 1 },
      { id: next(), name: 'Prêmio B: Trilha Chiptune em CD', category: 'Loteria Final Fantasy IX', platform: 'Merch', year: 2025, rarity: 4, lotteryOrder: 2 },
      { id: next(), name: 'Prêmio C: Capa de caixa de lenços (couro sintético)', category: 'Loteria Final Fantasy IX', platform: 'Merch', year: 2025, rarity: 3, lotteryOrder: 3 },
      { id: next(), name: 'Prêmio D: Mini prato — arte de Itahana (1 de 4)', category: 'Loteria Final Fantasy IX', platform: 'Merch', year: 2025, rarity: 3, lotteryOrder: 4 },
      { id: next(), name: 'Prêmio E: Conjunto de cartões postais (1 de 5) + envelope Mognet', category: 'Loteria Final Fantasy IX', platform: 'Merch', year: 2025, rarity: 2, lotteryOrder: 5 },
      { id: next(), name: 'Prêmio F: Chaveiro de borracha (1 de 10)', category: 'Loteria Final Fantasy IX', platform: 'Merch', year: 2025, rarity: 1, lotteryOrder: 6 },
      { id: next(), name: 'Prêmio Last: Tela F3 com arte do elenco (Itahana)', category: 'Loteria Final Fantasy IX', platform: 'Merch', year: 2025, rarity: 5, lotteryOrder: 7 },

      { id: next(), name: 'Deck Tetra Master (FFIX)', category: 'Cartas', platform: 'Merch', year: 2000, rarity: 4 },
      { id: next(), name: 'Triple Triad Collection (FFVIII)', category: 'Cartas', platform: 'Merch', year: 1999, rarity: 4 },
      { id: next(), name: 'Pelúcia Moogle', category: 'Merch', platform: 'Merch', year: 2015, rarity: 2 },
      { id: next(), name: 'Keychain Cactuar', category: 'Merch', platform: 'Merch', year: 2018, rarity: 1 },

      // Itens Merch adicionados a pedido
      { id: next(), name: 'Final Fantasy VII – Cloud Strife Cushion', category: 'Merch', platform: 'Merch', rarity: 1 },
      { id: next(), name: 'Final Fantasy VII – Nail Clipper Mirror', category: 'Merch', platform: 'Merch', rarity: 1 },
      { id: next(), name: 'Final Fantasy Silicon Ice Tray – Cactuar', category: 'Merch', platform: 'Merch', rarity: 1 },
      { id: next(), name: 'Final Fantasy Plush Eco Bag: Chocobo', category: 'Merch', platform: 'Merch', rarity: 1 },
      { id: next(), name: 'Final Fantasy Plush Eco Bag: Moogle', category: 'Merch', platform: 'Merch', rarity: 1 },
      { id: next(), name: 'Final Fantasy XVI House Rosfield Silver Cat Crest Pendant', category: 'Merch', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy XVI Wings of Promise Necklace', category: 'Merch', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy Cube Plush: Chocobo', category: 'Merch', platform: 'Merch', rarity: 1 },
      { id: next(), name: 'Final Fantasy VII Key Chain – Buster Sword', category: 'Merch', platform: 'Merch', rarity: 1 },
      { id: next(), name: 'Final Fantasy VII Key Chain –', category: 'Merch', platform: 'Merch', rarity: 1 },
      { id: next(), name: 'Final Fantasy feather Key Chain', category: 'Merch', platform: 'Merch', rarity: 1 },

      // Music Box — itens solicitados
      { id: next(), name: 'Final Fantasy IX Music Box — A Place to Call Home', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy IX Music Box — Not Alone', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy IX Music Box — Roses of May', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy VII Music Box', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy III Music Box — Crystal Tower', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy XIV Music Box — Flow', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy VIII Music Box — Love Grows', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy VII REMAKE Music Box — Tifa’s Theme – Seventh Heaven', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy IV Music Box — Theme of Love', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy XIV Music Box', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy XV ORCHESTRA Music Box', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'FINAL FANTASY XIV ORCHESTRA CONCERT Music Box — From the Heavens', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy V Music Box Distant Home Land', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy I Music Box — Main Theme', category: 'Music Box', platform: 'Merch', rarity: 2 },
      { id: next(), name: 'Final Fantasy II Music Box — Main Theme', category: 'Music Box', platform: 'Merch', rarity: 2 }
    ]
  }

})()
