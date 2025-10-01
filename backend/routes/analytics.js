import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Item from '../models/Item.js';

const router = express.Router();

// Dashboard completo de analytics
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const items = await Item.find({ userId });

    // Métricas gerais
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.metadata?.estimatedValue || 0), 0);
    const avgRarity = items.reduce((sum, item) => sum + (item.rarity || 0), 0) / totalItems || 0;

    // Distribuição por categoria
    const byCategory = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    // Distribuição por plataforma
    const byPlatform = items.reduce((acc, item) => {
      if (item.platform) {
        acc[item.platform] = (acc[item.platform] || 0) + 1;
      }
      return acc;
    }, {});

    // Distribuição por raridade
    const byRarity = items.reduce((acc, item) => {
      const rarity = item.rarity || 0;
      acc[rarity] = (acc[rarity] || 0) + 1;
      return acc;
    }, {});

    // Itens adicionados por mês (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const itemsByMonth = items
      .filter(item => new Date(item.createdAt) >= sixMonthsAgo)
      .reduce((acc, item) => {
        const month = new Date(item.createdAt).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

    // Top 5 categorias
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    // Itens mais raros
    const rarest = items
      .filter(item => item.rarity >= 4)
      .sort((a, b) => b.rarity - a.rarity)
      .slice(0, 10)
      .map(item => ({
        id: item._id,
        name: item.name,
        rarity: item.rarity,
        category: item.category
      }));

    // Itens mais valiosos
    const mostValuable = items
      .filter(item => item.metadata?.estimatedValue)
      .sort((a, b) => (b.metadata?.estimatedValue || 0) - (a.metadata?.estimatedValue || 0))
      .slice(0, 10)
      .map(item => ({
        id: item._id,
        name: item.name,
        value: item.metadata.estimatedValue,
        category: item.category
      }));

    // Completude por série (quantos jogos de cada FF)
    const seriesCompleteness = {
      'Final Fantasy VII': items.filter(i => i.category === 'Final Fantasy VII').length,
      'Final Fantasy X': items.filter(i => i.category === 'Final Fantasy X').length,
      'Final Fantasy XV': items.filter(i => i.category === 'Final Fantasy XV').length,
      // ... outros
    };

    res.json({
      overview: {
        totalItems,
        totalValue,
        avgRarity: avgRarity.toFixed(2),
        uniqueCategories: Object.keys(byCategory).length,
        uniquePlatforms: Object.keys(byPlatform).length
      },
      distributions: {
        byCategory,
        byPlatform,
        byRarity
      },
      trends: {
        itemsByMonth
      },
      highlights: {
        topCategories,
        rarest,
        mostValuable
      },
      seriesCompleteness,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar dados para análise externa
router.get('/export', authenticate, async (req, res) => {
  try {
    const items = await Item.find({ userId: req.user.userId }).lean();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=ifrit-inventory-export.json');
    res.json({ items, exportedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
