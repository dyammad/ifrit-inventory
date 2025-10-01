import OpenAI from 'openai';
import Item from '../models/Item.js';
import User from '../models/User.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Histórico de conversas (em produção, usar Redis ou MongoDB)
const conversationHistory = new Map();

/**
 * Chatbot inteligente para gerenciar inventário via linguagem natural
 */
export async function chatWithAssistant(userId, userMessage) {
  try {
    // Buscar contexto do usuário
    const user = await User.findById(userId);
    const userItems = await Item.find({ userId }).lean();

    // Recuperar histórico de conversa
    let history = conversationHistory.get(userId) || [];
    
    // Limitar histórico a últimas 10 mensagens
    if (history.length > 20) {
      history = history.slice(-20);
    }

    // Contexto da coleção
    const collectionContext = `
Usuário: ${user.name}
Total de itens: ${userItems.length}
Categorias: ${[...new Set(userItems.map(i => i.category))].join(', ')}
Últimos itens: ${userItems.slice(-5).map(i => i.name).join(', ')}
`;

    // System prompt
    const systemPrompt = `Você é o Ifrit Assistant, um assistente de IA especializado em ajudar colecionadores de Final Fantasy a gerenciar seus inventários.

Você pode:
1. Adicionar itens via linguagem natural ("adicione Final Fantasy VII para PS1")
2. Buscar itens ("mostre meus jogos de PS2")
3. Dar recomendações ("o que devo comprar?")
4. Responder perguntas sobre a coleção ("quantos jogos de FF VII eu tenho?")
5. Sugerir organização e insights

Contexto da coleção:
${collectionContext}

Seja amigável, conciso e útil. Quando o usuário pedir para adicionar um item, retorne JSON:
{
  "action": "add_item",
  "item": {
    "name": "nome",
    "category": "categoria",
    "platform": "plataforma",
    "rarity": número,
    "notes": "notas"
  }
}

Para buscas, retorne:
{
  "action": "search",
  "query": "termo de busca",
  "filters": { "category": "...", "platform": "..." }
}

Para conversas normais, responda naturalmente sem JSON.`;

    // Adicionar mensagem do usuário ao histórico
    history.push({ role: 'user', content: userMessage });

    // Fazer chamada à API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const assistantMessage = response.choices[0].message.content;

    // Adicionar resposta ao histórico
    history.push({ role: 'assistant', content: assistantMessage });
    conversationHistory.set(userId, history);

    // Verificar se é uma ação estruturada
    const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
    let action = null;

    if (jsonMatch) {
      try {
        action = JSON.parse(jsonMatch[0]);
      } catch (e) {
        // Não é JSON válido, apenas resposta de texto
      }
    }

    return {
      message: assistantMessage,
      action,
      conversationId: userId
    };
  } catch (error) {
    console.error('Erro no chatbot:', error.message);
    return {
      message: 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?',
      error: true
    };
  }
}

/**
 * Executar ação identificada pelo chatbot
 */
export async function executeAction(userId, action) {
  try {
    switch (action.action) {
      case 'add_item':
        const newItem = new Item({
          userId,
          ...action.item,
          metadata: {
            detectedBy: 'ai-chatbot',
            confidence: 0.9
          }
        });
        await newItem.save();
        
        // Atualizar contador do usuário
        await User.findByIdAndUpdate(userId, {
          $inc: { 'usage.itemsCount': 1 }
        });

        return {
          success: true,
          message: `Item "${action.item.name}" adicionado com sucesso!`,
          item: newItem
        };

      case 'search':
        const query = {};
        if (action.filters?.category) query.category = action.filters.category;
        if (action.filters?.platform) query.platform = action.filters.platform;
        if (action.query) {
          query.$text = { $search: action.query };
        }

        const items = await Item.find({ userId, ...query }).limit(20);
        return {
          success: true,
          items,
          count: items.length
        };

      case 'delete_item':
        await Item.findOneAndDelete({ userId, _id: action.itemId });
        await User.findByIdAndUpdate(userId, {
          $inc: { 'usage.itemsCount': -1 }
        });
        return {
          success: true,
          message: 'Item removido com sucesso!'
        };

      default:
        return {
          success: false,
          message: 'Ação não reconhecida'
        };
    }
  } catch (error) {
    console.error('Erro ao executar ação:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Limpar histórico de conversa
 */
export function clearConversation(userId) {
  conversationHistory.delete(userId);
  return { success: true, message: 'Histórico limpo' };
}

/**
 * Sugestões de comandos baseadas no contexto
 */
export async function getSuggestions(userId) {
  const userItems = await Item.find({ userId }).lean();
  
  const suggestions = [
    'Mostre meus itens mais raros',
    'Quanto vale minha coleção?',
    'O que devo comprar a seguir?',
    'Organize minha coleção por raridade'
  ];

  if (userItems.length === 0) {
    return [
      'Adicione Final Fantasy VII Remake para PS5',
      'Comece sua coleção',
      'Quais são os melhores jogos para começar?'
    ];
  }

  return suggestions;
}

export default {
  chatWithAssistant,
  executeAction,
  clearConversation,
  getSuggestions
};
