const API_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');

// Elementos DOM
const refreshInsights = document.getElementById('refreshInsights');
const recommendationsContainer = document.getElementById('recommendations');
const trendsContainer = document.getElementById('trends');
const organizationContainer = document.getElementById('organization');
const valueAnalysisContainer = document.getElementById('valueAnalysis');
const imageUploadZone = document.getElementById('imageUploadZone');
const imageUpload = document.getElementById('imageUpload');
const imageAnalysisResult = document.getElementById('imageAnalysisResult');

// Carregar todos os insights
async function loadAllInsights() {
  try {
    refreshInsights.disabled = true;
    refreshInsights.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Carregando...';

    const response = await fetch(`${API_URL}/ai/insights`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();

    // Renderizar cada seção
    renderRecommendations(data.recommendations);
    renderTrends(data.trends);
    renderOrganization(data.organization);

    refreshInsights.disabled = false;
    refreshInsights.innerHTML = '<i class="fa-solid fa-check"></i> Atualizado!';
    setTimeout(() => {
      refreshInsights.innerHTML = '<i class="fa-solid fa-rotate"></i> Atualizar Insights';
    }, 2000);
  } catch (error) {
    console.error('Erro ao carregar insights:', error);
    refreshInsights.disabled = false;
    refreshInsights.innerHTML = '<i class="fa-solid fa-rotate"></i> Atualizar Insights';
  }
}

// Renderizar recomendações
function renderRecommendations(data) {
  if (!data || !data.recommendations || data.recommendations.length === 0) {
    recommendationsContainer.innerHTML = `
      <div class="loading">
        <i class="fa-solid fa-box-open"></i>
        <p>Nenhuma recomendação disponível no momento</p>
      </div>
    `;
    return;
  }

  recommendationsContainer.innerHTML = data.recommendations.map(rec => `
    <div class="recommendation-card">
      <h3>${rec.name}</h3>
      <span class="priority ${rec.priority}">${rec.priority.toUpperCase()}</span>
      <p class="reason">${rec.reason}</p>
      <p class="value">💰 ${rec.estimatedValue}</p>
      <p style="color: var(--text-dim); font-size: 13px; margin-top: 8px;">
        <i class="fa-solid fa-tag"></i> ${rec.category}
      </p>
    </div>
  `).join('');
}

// Renderizar tendências
function renderTrends(trends) {
  if (!trends) {
    trendsContainer.innerHTML = '<div class="loading"><p>Dados insuficientes</p></div>';
    return;
  }

  trendsContainer.innerHTML = `
    <div class="trend-card">
      <div class="icon"><i class="fa-solid fa-box"></i></div>
      <div class="value">${trends.totalItems}</div>
      <div class="label">Total de Itens</div>
      <div class="change positive">
        <i class="fa-solid fa-arrow-up"></i> ${trends.recentAdditions} este mês
      </div>
    </div>

    <div class="trend-card">
      <div class="icon"><i class="fa-solid fa-star"></i></div>
      <div class="value">${trends.averageRarity}</div>
      <div class="label">Raridade Média</div>
    </div>

    <div class="trend-card">
      <div class="icon"><i class="fa-solid fa-coins"></i></div>
      <div class="value">R$ ${trends.collectionValue.toLocaleString('pt-BR')}</div>
      <div class="label">Valor Estimado</div>
    </div>

    <div class="trend-card">
      <div class="icon"><i class="fa-solid fa-chart-line"></i></div>
      <div class="value">${trends.growthRate}</div>
      <div class="label">Taxa de Crescimento</div>
      <div class="change positive">
        <i class="fa-solid fa-arrow-up"></i> Últimos 30 dias
      </div>
    </div>
  `;

  // Renderizar distribuição
  const categoryDist = Object.entries(trends.categoryDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  trendsContainer.innerHTML += `
    <div class="trend-card" style="grid-column: span 2;">
      <h3 style="margin-bottom: 16px;">Top Categorias</h3>
      ${categoryDist.map(([cat, count]) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>${cat}</span>
          <strong>${count} itens</strong>
        </div>
      `).join('')}
    </div>
  `;
}

// Renderizar sugestão de organização
function renderOrganization(org) {
  if (!org) {
    organizationContainer.innerHTML = '<div class="loading"><p>Dados insuficientes</p></div>';
    return;
  }

  organizationContainer.innerHTML = `
    <h3>Estratégia Recomendada</h3>
    <div class="strategy">
      <strong>${org.recommendedStrategy}</strong>
      ${org.secondarySort ? `<br><small>Ordenação secundária: ${org.secondarySort}</small>` : ''}
    </div>
    <p class="reasoning">${org.reasoning}</p>
    ${org.specialSections && org.specialSections.length > 0 ? `
      <h4 style="margin-top: 24px; margin-bottom: 12px;">Seções Especiais Sugeridas:</h4>
      <div class="sections">
        ${org.specialSections.map(section => `
          <span class="section-tag"><i class="fa-solid fa-folder"></i> ${section}</span>
        `).join('')}
      </div>
    ` : ''}
  `;
}

// Upload de imagem
imageUploadZone.addEventListener('click', () => {
  imageUpload.click();
});

imageUploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  imageUploadZone.style.borderColor = 'var(--primary)';
  imageUploadZone.style.background = 'rgba(255, 77, 46, 0.1)';
});

imageUploadZone.addEventListener('dragleave', () => {
  imageUploadZone.style.borderColor = 'var(--border)';
  imageUploadZone.style.background = 'transparent';
});

imageUploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  imageUploadZone.style.borderColor = 'var(--border)';
  imageUploadZone.style.background = 'transparent';
  
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    analyzeImage(file);
  }
});

imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    analyzeImage(file);
  }
});

// Analisar imagem com IA
async function analyzeImage(file) {
  try {
    imageAnalysisResult.hidden = false;
    imageAnalysisResult.innerHTML = `
      <div class="loading">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Analisando imagem com IA...</p>
      </div>
    `;

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_URL}/ai/analyze-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      const data = result.data;
      const imageUrl = URL.createObjectURL(file);

      imageAnalysisResult.innerHTML = `
        <h3><i class="fa-solid fa-check-circle" style="color: var(--success);"></i> Item Identificado!</h3>
        <img src="${imageUrl}" class="preview-image" alt="Preview">
        
        <div class="detected-info">
          <div class="info-row">
            <span class="info-label">Nome:</span>
            <span class="info-value">${data.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Plataforma:</span>
            <span class="info-value">${data.platform}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Categoria:</span>
            <span class="info-value">${data.category}</span>
          </div>
          ${data.year ? `
            <div class="info-row">
              <span class="info-label">Ano:</span>
              <span class="info-value">${data.year}</span>
            </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Raridade:</span>
            <span class="info-value">${'⭐'.repeat(data.rarity)} (${data.rarity}/5)</span>
          </div>
          ${data.notes ? `
            <div class="info-row">
              <span class="info-label">Detalhes:</span>
              <span class="info-value">${data.notes}</span>
            </div>
          ` : ''}
        </div>

        <div class="confidence">
          <p><strong>Confiança da IA:</strong> ${(data.confidence * 100).toFixed(0)}%</p>
          <div class="confidence-bar">
            <div class="confidence-fill" style="width: ${data.confidence * 100}%"></div>
          </div>
        </div>

        <div class="actions">
          <button class="btn primary" onclick="addDetectedItem(${JSON.stringify(data).replace(/"/g, '&quot;')})">
            <i class="fa-solid fa-plus"></i> Adicionar à Coleção
          </button>
          <button class="btn" onclick="imageAnalysisResult.hidden = true">
            <i class="fa-solid fa-xmark"></i> Cancelar
          </button>
        </div>
      `;
    } else {
      imageAnalysisResult.innerHTML = `
        <div style="text-align: center; color: #f44336;">
          <i class="fa-solid fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
          <p>${result.error || 'Não foi possível identificar o item'}</p>
          <button class="btn" onclick="imageAnalysisResult.hidden = true" style="margin-top: 16px;">
            Tentar Novamente
          </button>
        </div>
      `;
    }
  } catch (error) {
    console.error('Erro ao analisar imagem:', error);
    imageAnalysisResult.innerHTML = `
      <div style="text-align: center; color: #f44336;">
        <p>Erro ao processar imagem</p>
      </div>
    `;
  }
}

// Adicionar item detectado
async function addDetectedItem(itemData) {
  try {
    const response = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(itemData)
    });

    const result = await response.json();

    if (response.ok) {
      alert('✅ Item adicionado com sucesso!');
      imageAnalysisResult.hidden = true;
      imageUpload.value = '';
    } else {
      alert('❌ Erro ao adicionar item: ' + result.error);
    }
  } catch (error) {
    console.error('Erro ao adicionar item:', error);
    alert('❌ Erro ao adicionar item');
  }
}

// Atualizar insights
refreshInsights.addEventListener('click', loadAllInsights);

// Carregar ao iniciar
document.addEventListener('DOMContentLoaded', () => {
  if (!authToken) {
    alert('Por favor, faça login para acessar os insights de IA');
    window.location.href = '/';
    return;
  }
  
  loadAllInsights();
});
