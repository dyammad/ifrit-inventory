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
      'Loteria Final Fantasy XVI',
      'Trilhas Sonoras',
      'Merch',
      'Artbooks',
      'Cartas'
    ],
    activeCategory: 'Todos',
    query: '',
    sort: 'name-asc',
    sealedOnly: false,
    platform: ''
  }

  // Inicialização
  document.addEventListener('DOMContentLoaded', () => {
    state.items = sampleData()
    // Próximo ID baseado no maior existente
    state.nextId = state.items.reduce((m,i)=> Math.max(m, i.id||0), 0) + 1
    bindUI()
    renderCategories()
    prepareAddModal()
    applyFilters()
  })

  // UI bindings
  function bindUI(){
    const search = document.getElementById('searchInput')
    const sort = document.getElementById('sortSelect')
    const sealed = document.getElementById('sealedOnly')
    const platform = document.getElementById('platformFilter')
    const addBtn = document.getElementById('addItemBtn')

    search.addEventListener('input', e => { state.query = e.target.value.trim().toLowerCase(); applyFilters() })
    sort.addEventListener('change', e => { state.sort = e.target.value; applyFilters() })
    sealed.addEventListener('change', e => { state.sealedOnly = e.target.checked; applyFilters() })
    platform.addEventListener('change', e => { state.platform = e.target.value; applyFilters() })
    if (addBtn) addBtn.addEventListener('click', openAddModal)
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
    if (state.sealedOnly) {
      data = data.filter(i => !!i.sealed)
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
    renderGrid()
  }

  // KPIs
  function renderStats(){
    const el = document.getElementById('statsBar')
    const total = state.filtered.length
    const sealed = state.filtered.filter(i => i.sealed).length
    const avgRarity = state.filtered.length
      ? (state.filtered.reduce((s,i)=> s + (i.rarity||0), 0) / state.filtered.length)
      : 0
    const cats = new Set(state.filtered.map(i => i.category))

    el.innerHTML = `
      <div class="stat">
        <div class="label">Itens</div>
        <div class="value">${total}</div>
      </div>
      <div class="stat">
        <div class="label">Selados</div>
        <div class="value">${sealed}</div>
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

  // Grid
  function renderGrid(){
    const grid = document.getElementById('itemsGrid')
    const empty = document.getElementById('emptyState')

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

    const rarityStars = '★★★★★☆☆☆☆☆'.slice(5 - (item.rarity||0), 10 - (item.rarity||0)) // 5-base
    const platformBadge = item.platform ? `<span class=\"badge\">${item.platform}</span>` : ''
    const sealedBadge = item.sealed ? '<span class="badge ok">Selado</span>' : ''
    const prize = prizeLevel(item)
    const prizeBadge = prize ? `<span class=\"badge prize\">${prize}</span>` : ''
    const design = ffxviPrizeBDesign(item)
    const designBadge = design ? `<span class=\"badge design\">${design}</span>` : ''
    const thumbContent = item.image
      ? `<img src="${item.image}" alt="${escapeAttr(item.name)}" />`
      : (designIcon(item) || thumbIcon(item.category))

    el.innerHTML = `
      <div class="thumb">${thumbContent}</div>
      <div class="body">
        <div class="badges">
          <span class=\"badge brand\">${item.category}</span>
          ${prizeBadge}
          ${designBadge}
          ${platformBadge}
          ${sealedBadge}
        </div>
        <div class="title">${item.name}</div>
        <div class="meta">${item.year || '—'} • Raridade: ${item.rarity||0}/5 • ${rarityStars}</div>
        ${item.notes ? `<div class="meta">${item.notes}</div>` : ''}
      </div>
      <div class="footer">
        <button title="Cadastrar item" onclick="openAddModal()">
          <i class="fa-solid fa-plus"></i> Cadastrar item
        </button>
        <button title="Marca/Desmarca selado" onclick="(${toggleSealed})(${item.id})">
          <i class="fa-solid fa-tag"></i> Selado
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
      case 'Artbooks': return '🖼️'
      case 'Cartas': return '🃏'
      case 'Loteria Final Fantasy VII Remake': return '🎟️'
      case 'Loteria Final Fantasy XVI': return '🎟️'
      default: return '🔥'
    }
  }
  function escapeAttr(str){
    return String(str).replace(/["'\\\n]/g, s => ({'"':'&quot;','\'':'&#39;','\\':'\\\\','\n':'\\n'}[s]))
  }
  function toggleSealed(id){
    const idx = state.items.findIndex(i => i.id === id)
    if (idx > -1){
      state.items[idx].sealed = !state.items[idx].sealed
      applyFilters()
    }
  }
  // expõe para onclick
  window.toggleSealed = toggleSealed

  function prizeLevel(item){
    // Apenas para categorias de loteria
    if (!item || !item.category || !/^Loteria /.test(item.category)) return ''
    if (item.prizeLevel) return item.prizeLevel
    const n = (item.name || '').toLowerCase()
    // Last prize
    if (n.includes('prêmio last') || n.includes('end prize') || n.includes('prêmio raro')) return 'Last'
    // Match "Prêmio A:" / "Prêmios D:" etc.
    const m = n.match(/pr[eê]m(?:io|ios)\s*([a-g])/i)
    if (m && m[1]) return m[1].toUpperCase()
    return ''
  }

  // Detecta o "design" do Prêmio B (FFXVI) a partir do nome
  function ffxviPrizeBDesign(item){
    if (!item || item.category !== 'Loteria Final Fantasy XVI') return ''
    const n = (item.name||'')
    if (!/Prêmio\s*B/i.test(n)) return ''
    // Ex.: "Prêmio B: Figure Collection — Ifrit"
    const m = n.match(/—\s*([A-Za-zÀ-ÿ]+)/)
    return m && m[1] ? m[1] : ''
  }

  // Ícone padrão por design quando não há imagem
  function designIcon(item){
    const d = ffxviPrizeBDesign(item)
    switch((d||'').toLowerCase()){
      case 'ifrit': return '🔥'
      case 'phoenix': return '🐦'
      case 'shiva': return '❄️'
      case 'ramuh': return '⚡'
      case 'garuda': return '🌪️'
      case 'titan': return '🗿'
      case 'bahamut': return '🐉'
      case 'odin': return '🗡️'
      default: return ''
    }
  }

  // ----- Adicionar Item -----
  function prepareAddModal(){
    const modal = document.getElementById('addItemModal')
    if (!modal) return

    const form = document.getElementById('addItemForm')
    const closeBtn = document.getElementById('closeAddModal')
    const cancelBtn = document.getElementById('cancelAddBtn')
    const imageInput = document.getElementById('imageInput')
    const clearImageBtn = document.getElementById('clearImageBtn')
    const preview = document.getElementById('imagePreview')
    const catSelect = document.getElementById('addCategory')

    // Preencher categorias (exceto "Todos")
    catSelect.innerHTML = ''
    state.categories.filter(c => c !== 'Todos').forEach(c => {
      const opt = document.createElement('option')
      opt.value = c
      opt.textContent = c
      catSelect.appendChild(opt)
    })

    // Estados locais do modal
    let currentImageData = ''

    function resetForm(){
      form.reset()
      currentImageData = ''
      preview.innerHTML = '<i class="fa-regular fa-image"></i>'
    }

    function show(){ modal.hidden = false; modal.setAttribute('aria-hidden','false') }
    function hide(){ modal.hidden = true; modal.setAttribute('aria-hidden','true'); resetForm() }

    // Expor para handlers
    window.openAddModal = () => { show() }
    function onClose(){ hide() }

    // Eventos
    if (closeBtn) closeBtn.addEventListener('click', onClose)
    if (cancelBtn) cancelBtn.addEventListener('click', onClose)
    modal.addEventListener('click', (e)=>{ if (e.target === modal) onClose() })

    if (imageInput){
      imageInput.addEventListener('change', (e)=>{
        const file = e.target.files && e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
          currentImageData = reader.result
          preview.innerHTML = `<img src="${currentImageData}" alt="preview" />`
        }
        reader.readAsDataURL(file)
      })
    }
    if (clearImageBtn){
      clearImageBtn.addEventListener('click', ()=>{
        currentImageData = ''
        preview.innerHTML = '<i class="fa-regular fa-image"></i>'
        if (imageInput) imageInput.value = ''
      })
    }

    if (form){
      form.addEventListener('submit', (e)=>{
        e.preventDefault()
        const fd = new FormData(form)
        const item = {
          id: state.nextId++,
          name: (fd.get('name')||'').toString().trim(),
          category: (fd.get('category')||'').toString(),
          platform: (fd.get('platform')||'').toString().trim() || undefined,
          year: fd.get('year') ? Number(fd.get('year')) : undefined,
          rarity: fd.get('rarity') ? Math.max(0, Math.min(5, Number(fd.get('rarity')))) : 0,
          sealed: !!fd.get('sealed'),
          notes: (fd.get('notes')||'').toString().trim() || undefined,
          image: currentImageData || undefined,
        }
        if (!item.name || !item.category){
          alert('Preencha ao menos Nome e Categoria.')
          return
        }
        state.items.unshift(item)
        // Se a categoria ativa não for compatível, ajustar para mostrar o item recém adicionado
        if (state.activeCategory !== 'Todos' && state.activeCategory !== item.category){
          state.activeCategory = item.category
          renderCategories()
        }
        applyFilters()
        hide()
      })
    }
  }

  function openAddModal(){ if (window.openAddModal) window.openAddModal() }

  // Dados de exemplo
  function sampleData(){
    let id = 1
    const next = () => id++
    return [
      { id: next(), name: 'Final Fantasy VII (PS1) Black Label', category: 'Jogos', platform: 'PS1', year: 1997, sealed: false, rarity: 4, notes: 'Completo, manual incluso' },
      { id: next(), name: 'Final Fantasy VIII (PS1)', category: 'Jogos', platform: 'PS1', year: 1999, sealed: true, rarity: 3, notes: 'Lacrado, selo original' },
      { id: next(), name: 'Final Fantasy IX (PS1)', category: 'Jogos', platform: 'PS1', year: 2000, sealed: false, rarity: 3 },
      { id: next(), name: 'Final Fantasy X (PS2)', category: 'Jogos', platform: 'PS2', year: 2001, sealed: false, rarity: 2 },
      { id: next(), name: 'Final Fantasy XII Steelbook (PS2)', category: 'Jogos', platform: 'PS2', year: 2006, sealed: false, rarity: 3 },
      { id: next(), name: 'Final Fantasy XIII Lightning Returns (PS3)', category: 'Jogos', platform: 'PS3', year: 2013, sealed: false, rarity: 2 },
      { id: next(), name: 'Final Fantasy XV Royal Edition (PS4)', category: 'Jogos', platform: 'PS4', year: 2018, sealed: true, rarity: 2 },
      { id: next(), name: 'Final Fantasy VII Remake Deluxe (PS4)', category: 'Jogos', platform: 'PS4', year: 2020, sealed: false, rarity: 4, notes: 'Com artbook e trilha' },
      { id: next(), name: 'Final Fantasy VII Rebirth (PS5)', category: 'Jogos', platform: 'PS5', year: 2024, sealed: false, rarity: 4 },
      { id: next(), name: 'Final Fantasy XVI Deluxe (PS5)', category: 'Jogos', platform: 'PS5', year: 2023, sealed: true, rarity: 4 },

      { id: next(), name: 'Dicionário de Lore — FF Compendium', category: 'Livros', platform: 'Livro', year: 2016, sealed: false, rarity: 3 },
      { id: next(), name: 'Final Fantasy Ultimania Archive Vol. 1', category: 'Artbooks', platform: 'Livro', year: 2018, sealed: false, rarity: 4 },
      { id: next(), name: 'Final Fantasy VII Remake Material Ultimania', category: 'Artbooks', platform: 'Livro', year: 2020, sealed: false, rarity: 5 },

      { id: next(), name: 'OST Final Fantasy VII Vinyl', category: 'Trilhas Sonoras', platform: 'Merch', year: 2019, sealed: true, rarity: 4 },
      { id: next(), name: 'FFXIV Shadowbringers OST', category: 'Trilhas Sonoras', platform: 'Merch', year: 2019, sealed: false, rarity: 3 },

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

      { id: next(), name: 'Deck Tetra Master (FFIX)', category: 'Cartas', platform: 'Merch', year: 2000, sealed: false, rarity: 4 },
      { id: next(), name: 'Triple Triad Collection (FFVIII)', category: 'Cartas', platform: 'Merch', year: 1999, sealed: false, rarity: 4 },
      { id: next(), name: 'Pelúcia Moogle', category: 'Merch', platform: 'Merch', year: 2015, sealed: false, rarity: 2 },
      { id: next(), name: 'Keychain Cactuar', category: 'Merch', platform: 'Merch', year: 2018, sealed: true, rarity: 1 }
    ]
  }

})()
