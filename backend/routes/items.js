import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import { analyzeGameImage, enrichWithIGDB } from '../services/aiVision.js';

const router = express.Router();

// Configurar upload de imagens
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// Listar todos os itens do usuário
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, platform, search, sort } = req.query;
    
    const query = { userId: req.user.userId };
    
    if (category) query.category = category;
    if (platform) query.platform = platform;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = {};
    switch (sort) {
      case 'name-asc': sortOption = { name: 1 }; break;
      case 'name-desc': sortOption = { name: -1 }; break;
      case 'year-desc': sortOption = { year: -1 }; break;
      case 'year-asc': sortOption = { year: 1 }; break;
      case 'rarity-desc': sortOption = { rarity: -1 }; break;
      case 'rarity-asc': sortOption = { rarity: 1 }; break;
      default: sortOption = { createdAt: -1 };
    }

    const items = await Item.find(query).sort(sortOption);
    res.json({ items, count: items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter item específico
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Adicionar novo item (com IA opcional)
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    // Verificar limite do plano
    if (!user.canAddItem()) {
      return res.status(403).json({
        error: 'Limite de itens atingido para seu plano',
        plan: user.subscription.plan
      });
    }

    let itemData = req.body;

    // Se houver imagem, usar IA para identificar
    if (req.file && user.canUseAI()) {
      const aiResult = await analyzeGameImage(req.file.buffer);
      
      if (aiResult.success) {
        // Mesclar dados da IA com dados fornecidos
        itemData = {
          ...aiResult.data,
          ...itemData, // Dados manuais têm prioridade
          metadata: {
            detectedBy: aiResult.method,
            confidence: aiResult.data.confidence
          }
        };

        // Incrementar uso de IA
        await User.findByIdAndUpdate(req.user.userId, {
          $inc: { 'usage.aiRequestsThisMonth': 1 }
        });
      }

      // Converter imagem para base64 (em produção, usar S3/CloudFlare)
      itemData.image = {
        url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        size: req.file.size
      };
    }

    // Enriquecer com dados da IGDB
    if (itemData.name) {
      const igdbData = await enrichWithIGDB(itemData.name);
      if (igdbData) {
        itemData.metadata = {
          ...itemData.metadata,
          igdbId: igdbData.igdbId
        };
        if (!itemData.year) itemData.year = igdbData.year;
        if (!itemData.notes) itemData.notes = igdbData.summary;
      }
    }

    // Criar item
    const item = new Item({
      userId: req.user.userId,
      ...itemData
    });

    await item.save();

    // Atualizar contador
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { 'usage.itemsCount': 1 }
    });

    // Emitir evento WebSocket
    const io = req.app.get('io');
    io.to(`user-${req.user.userId}`).emit('item-added', item);

    res.status(201).json({
      message: 'Item adicionado com sucesso',
      item,
      aiUsed: !!req.file
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar item
router.put('/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    const updateData = req.body;

    if (req.file) {
      updateData.image = {
        url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        size: req.file.size
      };
    }

    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      updateData,
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    // Emitir evento WebSocket
    const io = req.app.get('io');
    io.to(`user-${req.user.userId}`).emit('item-updated', item);

    res.json({ message: 'Item atualizado', item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar item
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    // Atualizar contador
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { 'usage.itemsCount': -1 }
    });

    // Emitir evento WebSocket
    const io = req.app.get('io');
    io.to(`user-${req.user.userId}`).emit('item-deleted', { id: req.params.id });

    res.json({ message: 'Item removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estatísticas da coleção
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const items = await Item.find({ userId: req.user.userId });

    const stats = {
      total: items.length,
      byCategory: {},
      byPlatform: {},
      byRarity: {},
      averageRarity: 0,
      totalValue: 0
    };

    items.forEach(item => {
      // Por categoria
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
      
      // Por plataforma
      if (item.platform) {
        stats.byPlatform[item.platform] = (stats.byPlatform[item.platform] || 0) + 1;
      }
      
      // Por raridade
      const rarity = item.rarity || 0;
      stats.byRarity[rarity] = (stats.byRarity[rarity] || 0) + 1;
      stats.averageRarity += rarity;
      
      // Valor total
      stats.totalValue += item.metadata?.estimatedValue || 0;
    });

    stats.averageRarity = items.length > 0 ? (stats.averageRarity / items.length).toFixed(2) : 0;

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
