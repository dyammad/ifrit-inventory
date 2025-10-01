// Configuração da API
const API_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');

// Elementos DOM
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const closeChat = document.getElementById('closeChat');
const clearChat = document.getElementById('clearChat');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessage = document.getElementById('sendMessage');
const voiceInput = document.getElementById('voiceInput');
const quickSuggestions = document.getElementById('quickSuggestions');
const typingIndicator = document.querySelector('.typing-indicator');

// Estado
let isOpen = false;
let isTyping = false;

// Toggle chatbot
chatbotToggle.addEventListener('click', () => {
  isOpen = !isOpen;
  chatbotWindow.hidden = !isOpen;
  if (isOpen) {
    chatInput.focus();
    loadSuggestions();
  }
});

closeChat.addEventListener('click', () => {
  isOpen = false;
  chatbotWindow.hidden = true;
});

// Enviar mensagem
sendMessage.addEventListener('click', () => sendUserMessage());
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendUserMessage();
  }
});

// Sugestões rápidas
quickSuggestions.addEventListener('click', (e) => {
  if (e.target.classList.contains('suggestion-chip')) {
    const message = e.target.textContent;
    chatInput.value = message;
    sendUserMessage();
  }
});

// Limpar conversa
clearChat.addEventListener('click', async () => {
  if (confirm('Deseja limpar todo o histórico de conversa?')) {
    try {
      await fetch(`${API_URL}/ai/chat/history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Limpar UI
      chatMessages.innerHTML = '';
      addAssistantMessage('Histórico limpo! Como posso ajudar?');
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  }
});

// Entrada por voz
let recognition;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    sendUserMessage();
  };

  recognition.onerror = (event) => {
    console.error('Erro no reconhecimento de voz:', event.error);
    addAssistantMessage('Desculpe, não consegui entender. Pode digitar?');
  };

  voiceInput.addEventListener('click', () => {
    recognition.start();
    voiceInput.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
    setTimeout(() => {
      voiceInput.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    }, 3000);
  });
} else {
  voiceInput.style.display = 'none';
}

// Enviar mensagem do usuário
async function sendUserMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  // Adicionar mensagem do usuário
  addUserMessage(message);
  chatInput.value = '';

  // Mostrar indicador de digitação
  showTyping();

  try {
    const response = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    hideTyping();

    // Adicionar resposta do assistente
    addAssistantMessage(data.message);

    // Se houver ação executada
    if (data.actionResult) {
      if (data.actionResult.success) {
        addActionResult(data.actionResult.message, 'success');
      } else {
        addActionResult(data.actionResult.error, 'error');
      }
    }

    // Atualizar sugestões
    loadSuggestions();
  } catch (error) {
    hideTyping();
    console.error('Erro ao enviar mensagem:', error);
    addAssistantMessage('Desculpe, tive um problema ao processar sua mensagem. Tente novamente.');
  }
}

// Adicionar mensagem do usuário
function addUserMessage(text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user';
  messageDiv.innerHTML = `
    <div class="message-avatar">
      <i class="fa-solid fa-user"></i>
    </div>
    <div class="message-content">
      <p>${escapeHtml(text)}</p>
    </div>
  `;
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

// Adicionar mensagem do assistente
function addAssistantMessage(text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant';
  
  // Converter markdown simples
  const formattedText = formatMessage(text);
  
  messageDiv.innerHTML = `
    <div class="message-avatar">
      <i class="fa-solid fa-robot"></i>
    </div>
    <div class="message-content">
      ${formattedText}
    </div>
  `;
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

// Adicionar resultado de ação
function addActionResult(text, type = 'success') {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant';
  messageDiv.innerHTML = `
    <div class="message-avatar">
      <i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    </div>
    <div class="message-content ${type === 'success' ? 'action-result' : 'error'}">
      <p>${escapeHtml(text)}</p>
    </div>
  `;
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

// Mostrar/esconder indicador de digitação
function showTyping() {
  isTyping = true;
  typingIndicator.hidden = false;
}

function hideTyping() {
  isTyping = false;
  typingIndicator.hidden = true;
}

// Scroll para o final
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Carregar sugestões
async function loadSuggestions() {
  try {
    const response = await fetch(`${API_URL}/ai/chat/suggestions`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    const data = await response.json();
    
    quickSuggestions.innerHTML = data.suggestions
      .map(s => `<button class="suggestion-chip">${escapeHtml(s)}</button>`)
      .join('');
  } catch (error) {
    console.error('Erro ao carregar sugestões:', error);
  }
}

// Formatar mensagem (markdown simples)
function formatMessage(text) {
  // Remover JSON se houver
  text = text.replace(/\{[\s\S]*\}/g, '');
  
  // Quebras de linha
  const lines = text.split('\n').filter(l => l.trim());
  
  let html = '';
  let inList = false;
  
  lines.forEach(line => {
    line = line.trim();
    
    // Lista
    if (line.startsWith('- ') || line.startsWith('• ')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${escapeHtml(line.substring(2))}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      
      // Negrito
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Código
      line = line.replace(/`(.*?)`/g, '<code>$1</code>');
      
      html += `<p>${line}</p>`;
    }
  });
  
  if (inList) {
    html += '</ul>';
  }
  
  return html;
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Verificar se está autenticado
  if (!authToken) {
    addAssistantMessage('Por favor, faça login para usar o assistente de IA.');
    sendMessage.disabled = true;
    chatInput.disabled = true;
  }
});
