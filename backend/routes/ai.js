import express from 'express';
import { authenticate, checkAILimit } from '../middleware/auth.js';
import {
  generateRecommendations,
  predictMarketValue,
  suggestOrganization,
  analyzeCollectionTrends
} from '../services/aiRecommendations.js';
import {
  chatWithAssistant,
  executeAction,
  clearConversation,
  getSuggestions
} from '../services/aiChatbot.js';
import { analyzeGameImage, findSimilarItems } from '../services/aiVision.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Recomendações personalizadas
router.get('/recommendations', authenticate, checkAILimit, async (req, res) => {
  try {
    const recommendations = await generateRecommendations(req.user.userId);
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Prever valor de mercado
router.post('/predict-value', authenticate, checkAILimit, async (req, res) => {
  try {
    const { itemName, rarity, year, platform } = req.body;
    const prediction = await predictMarketValue(itemName, rarity, year, platform);
    res.json({ prediction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sugerir organização
router.get('/organize', authenticate, checkAILimit, async (req, res) => {
  try {
    const suggestion = await suggestOrganization(req.user.userId);
    res.json({ suggestion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Análise de tendências
router.get('/trends', authenticate, async (req, res) => {
  try {
    const trends = await analyzeCollectionTrends(req.user.userId);
    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chatbot - enviar mensagem
router.post('/chat', authenticate, checkAILimit, async (req, res) => {
  try {
    const { message } = req.body;
    const response = await chatWithAssistant(req.user.userId, message);

    // Se houver ação, executar
    if (response.action) {
      const actionResult = await executeAction(req.user.userId, response.action);
      response.actionResult = actionResult;
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chatbot - obter sugestões
router.get('/chat/suggestions', authenticate, async (req, res) => {
  try {
    const suggestions = await getSuggestions(req.user.userId);
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chatbot - limpar histórico
router.delete('/chat/history', authenticate, async (req, res) => {
  try {
    const result = clearConversation(req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analisar imagem (reconhecimento)
router.post('/analyze-image', authenticate, checkAILimit, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem fornecida' });
    }

    const result = await analyzeGameImage(req.file.buffer);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Encontrar itens similares (detectar duplicatas)
router.post('/find-similar', authenticate, async (req, res) => {
  try {
    const { itemName, existingItems } = req.body;
    const similar = await findSimilarItems(itemName, existingItems);
    res.json({ similar });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard de insights com IA
router.get('/insights', authenticate, checkAILimit, async (req, res) => {
  try {
    const [recommendations, trends, organization] = await Promise.all([
      generateRecommendations(req.user.userId),
      analyzeCollectionTrends(req.user.userId),
      suggestOrganization(req.user.userId)
    ]);

    res.json({
      recommendations,
      trends,
      organization,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
