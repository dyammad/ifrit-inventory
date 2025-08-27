// Ifrit Inventory Mobile App — organização de coleção Final Fantasy
// Interface otimizada para dispositivos móveis

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
      'Merch',
      'Artbook/Databook',
      'Cartas'
    ],
    activeCategory: 'Todos',
    query: '',
    sort: 'name-asc',
    platform: '',
    isNavOpen: false
  }

  // Mobile-specific helpers
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer')
    if (!container) return

    const toast = document.createElement('div')
    toast.className = `toast ${type}`
    toast.textContent = message
    
    container.appendChild(toast)
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show')
    })
    
    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }

  function vibrate(pattern = [50]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  // Helpers
  function prizeLevel(item){
    if (!item || !item.name) return ''
    const isLottery = /^Loteria /.test(item.category || '')
    if (!isLottery) return ''
    const name = String(item.name)
    if (/Pr[eê]mio\s+Raro/i.test(name) || /End\s*Prize/i.test(name)) return 'End'
    const m = name.match(/^Pr[eê]m(i|í)o?s?\s+([A-G]):/i)
    return m ? `Prêmio ${m[2].toUpperCase()}` : ''
  }

  function ffxviPrizeBDesign(item){
    if (!item || !item.name || item.category !== 'Loteria Final Fantasy XVI') return ''
    const m = String(item.name).match(/^Pr[eê]mio\s+B:\s*Figure Collection\s+—\s*(.+)$/i)
    return m ? m[1] : ''
  }

  // Inicialização
  document.addEventListener('DOMContentLoaded', () => {
    state.items = loadItems() || sampleData()
    state.nextId = state.items.reduce((m,i)=> Math.max(m, i.id||0), 0) + 1
    
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
    
    // Mobile-specific initialization
    setupMobileNavigation()
    setupSearchEnhancements()
    setupTouchGestures()
  })

  // Mobile Navigation
  function setupMobileNavigation() {
    const menuToggle = document.getElementById('menuToggle')
    const mobileNav = document.getElementById('mobileNav')
    const navClose = document.getElementById('navClose')
    const navOverlay = mobileNav?.querySelector('.nav-overlay')

    function openNav() {
      if (mobileNav) {
        mobileNav.hidden = false
        state.isNavOpen = true
        document.body.style.overflow = 'hidden'
        vibrate([30])
      }
    }

    function closeNav() {
      if (mobileNav) {
        mobileNav.hidden = true
        state.isNavOpen = false
        document.body.style.overflow = ''
      }
    }

    if (menuToggle) menuToggle.addEventListener('click', openNav)
    if (navClose) navClose.addEventListener('click', closeNav)
    if (navOverlay) navOverlay.addEventListener('click', closeNav)

    // Close nav on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isNavOpen) {
        closeNav()
      }
    })
  }

  // Enhanced Search
  function setupSearchEnhancements() {
    const searchInput = document.getElementById('searchInput')
    const searchClear = document.getElementById('searchClear')

    if (searchInput && searchClear) {
      searchInput.addEventListener('input', (e) => {
        const value = e.target.value.trim()
        searchClear.hidden = !value
        state.query = value.toLowerCase()
        applyFilters()
      })

      searchClear.addEventListener('click', () => {
        searchInput.value = ''
        searchClear.hidden = true
        state.query = ''
        applyFilters()
        searchInput.focus()
      })
    }
  }

  // Touch Gestures
  function setupTouchGestures() {
    let startY = 0
    let currentY = 0
    let isScrolling = false

    // Pull to refresh gesture (simplified)
    document.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY
    }, { passive: true })

    document.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].clientY
      isScrolling = Math.abs(currentY - startY) > 10
    }, { passive: true })

    // Add haptic feedback to buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('button, .btn, .card')) {
        vibrate([20])
      }
    })
  }

  // UI bindings
  function bindUI(){
    const sort = document.getElementById('sortSelect')
    const platform = document.getElementById('platformFilter')
    const addBtn = document.getElementById('addItemBtn')

    if (sort) sort.addEventListener('change', e => { 
      state.sort = e.target.value
      applyFilters()
      showToast('Ordenação alterada')
    })
    
    if (platform) platform.addEventListener('change', e => { 
      state.platform = e.target.value
      applyFilters()
      showToast(e.target.value ? `Filtrado por ${e.target.value}` : 'Filtro removido')
    })
    
    if (addBtn) addBtn.addEventListener('click', () => {
      const cat = state.activeCategory !== 'Todos' ? state.activeCategory : ''
      openAddModal({ category: cat })
    })

    // Backup: Exportar / Importar
    const exportBtn = document.getElementById('exportBtn')
    if (exportBtn){
      exportBtn.addEventListener('click', () => {
        exportItems()
        showToast('Backup exportado com sucesso!', 'success')
      })
    }
    
    const importInput = document.getElementById('importInput')
    if (importInput){
      importInput.addEventListener('change', async (e)=>{
        const file = e.target.files && e.target.files[0]
        if (!file) return
        try{
          await importItemsFromFile(file)
          showToast('Importação concluída com sucesso!', 'success')
          vibrate([100, 50, 100])
        }catch(err){
          console.error(err)
          showToast('Falha ao importar JSON. Verifique o arquivo.', 'error')
          vibrate([200])
        }finally{
          e.target.value = ''
        }
      })
    }

    // Restaurar banco (padrão)
    const resetBtn = document.getElementById('resetDbBtn')
    if (resetBtn){
      resetBtn.addEventListener('click', () => resetDatabase())
    }
  }

  // Categorias
  function renderCategories(){
    const nav = document.getElementById('categoryList')
    if (!nav) return
    
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
        
        // Close mobile nav after selection
        const mobileNav = document.getElementById('mobileNav')
        if (mobileNav && !mobileNav.hidden) {
          mobileNav.hidden = true
          state.isNavOpen = false
          document.body.style.overflow = ''
        }
        
        showToast(`Categoria: ${cat}`)
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
    renderGrid()
  }

  // KPIs
  function renderStats(){
    const el = document.getElementById('statsBar')
    if (!el) return
    
    const withPhoto = state.filtered.filter(i => !!i.image)
    const total = withPhoto.length
    const avgRarity = withPhoto.length
      ? (withPhoto.reduce((s,i)=> s + (i.rarity||0), 0) / withPhoto.length)
      : 0
    const cats = new Set(withPhoto.map(i => i.category))

    el.innerHTML = `
      <div class="stat">
        <div class="label">Itens</div>
        <div class="value">${total}</div>
      </div>
      <div class="stat">
        <div class="label">Raridade</div>
        <div class="value">${avgRarity.toFixed(1)}/5</div>
      </div>
      <div class="stat">
        <div class="label">Categorias</div>
        <div class="value">${cats.size}</div>
      </div>
      <div class="stat">
        <div class="label">Total</div>
        <div class="value">${state.items.length}</div>
      </div>
    `
  }

  // Dashboard de Loterias
  function renderLotteryDashboard(){
    const wrap = document.getElementById('lotteryDashboard')
    if (!wrap) return
    
    const categories = Array.from(new Set(state.items
      .filter(i => /^Loteria /.test(i.category||''))
      .map(i => i.category)))

    if (!categories.length){ wrap.innerHTML = ''; return }

    const cards = categories.map(cat => {
      const items = state.items.filter(i => i.category === cat)
      const withOrder = items.filter(i => typeof i.lotteryOrder === 'number')
      const expected = withOrder.length ? Math.max(...withOrder.map(i => i.lotteryOrder||0)) : items.length
      
      if (withOrder.length){
        const distinctWithPhoto = new Set(withOrder.filter(i => !!i.image).map(i => i.lotteryOrder))
        var collected = distinctWithPhoto.size
      } else {
        var collected = items.filter(i => !!i.image).length
      }
      
      const pct = expected ? Math.min(100, Math.round((collected/expected)*100)) : 0
      
      return `
        <div class="dash-card">
          <div class="dash-title">${cat.replace('Loteria ', '')}</div>
          <div class="dash-row">
            <span>Progresso</span>
            <span class="dash-val">${collected}/${expected} • ${pct}%</span>
          </div>
          <div class="progress">
            <span style="width:${pct}%"></span>
          </div>
        </div>
      `
    })
    wrap.innerHTML = cards.join('')
  }

  // Grid
  function renderGrid(){
    const grid = document.getElementById('itemsGrid')
    const empty = document.getElementById('emptyState')
    
    if (!grid || !empty) return

    grid.innerHTML = ''
    if (!state.filtered.length){
      empty.hidden = false
      return
    }
    empty.hidden = true

    state.filtered.forEach(item => grid.appendChild(card(item)))
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
      ? `<img src="${item.image}" alt="${escapeAttr(item.name)}" loading="lazy" />`
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
        <button onclick="openAddModal({name: '${escapeAttr(item.name)}', category: '${escapeAttr(item.category)}'})">
          <i class="fa-solid fa-plus"></i> Cadastrar
        </button>
        <button onclick="deleteItem(${item.id})" style="color: var(--danger)">
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
    return String(str).replace(/["'\\\n]/g, s => ({'"':'"','\'':'&#39;','\\':'\\\\','\n':'\\n'}[s]))
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
      showToast('Item excluído', 'success')
      vibrate([50])
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
    const modalOverlay = modal.querySelector('.modal-overlay')

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
      modal.hidden = false
      modal.setAttribute('aria-hidden','false')
      document.body.style.overflow = 'hidden'
      
      if (nameInput) nameInput.value = defaultValues.name || ''
      if (catSelect){
        const preferred = defaultValues.category || (state.activeCategory !== 'Todos' ? state.activeCategory : '')
        if (preferred) catSelect.value = preferred
      }
      
      // Focus with delay for mobile keyboards
      setTimeout(() => {
        if (nameInput) nameInput.focus()
      }, 300)
    }
    
    function hide(){ 
      modal.hidden = true
      modal.setAttribute('aria-hidden','true')
      document.body.style.overflow = ''
      resetForm()
    }

    if (closeBtn) closeBtn.addEventListener('click', hide)
    if (cancelBtn) cancelBtn.addEventListener('click', hide)
    if (modalOverlay) modalOverlay.addEventListener('click', hide)

    if (imageInput){
      imageInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0]
        if (!file) { 
          currentImageData = ''
          if (preview) preview.innerHTML = '<i class="fa-regular fa-image"></i>'
          return 
        }
        
        // Show loading state
        if (preview) preview.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'
        
        const reader = new FileReader()
        reader.onload = () => {
          currentImageData = reader.result
          if (preview) preview.innerHTML = `<img src="${currentImageData}" alt="preview" />`
          showToast('Foto carregada!', 'success')
        }
        reader.onerror = () => {
          showToast('Erro ao carregar foto', 'error')
          if (preview) preview.innerHTML = '<i class="fa-regular fa-image"></i>'
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
        }
        
        if (!item.name || !item.category){
          showToast('Preencha nome e categoria', 'error')
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
        hide()
        showToast('Item adicionado com sucesso!', 'success')
        vibrate([100, 50, 100])
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

  // Persistência local
  const STORAGE_KEY = 'ifritInventory.items'
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
    }catch(e){ 
      showToast('Erro ao salvar dados', 'error')
    }
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
    state.items = parsed
    state.nextId = state.items.reduce((m,i)=> Math.max(m, i.id||0), 0) + 1
    saveItems()
    renderCategories()
    applyFilters()
  }

  // Restaurar banco para os dados de exemplo
  function resetDatabase(){
    const ok = confirm('Restaurar o banco de dados para o padrão? Isso substituirá os itens atuais.')
    if (!ok) return
    state.items = sampleData()
    state.nextId = state.items.reduce((m,i)=> Math.max(m, i.id||0), 0) + 1
    saveItems()
    renderCategories()
    applyFilters()
    showToast('Banco restaurado!', 'success')
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
      { id: next(), name: 'Keychain Cactuar', category: 'Merch', platform: 'Merch', year: 2018, rarity: 1 }
    ]
  }

})()