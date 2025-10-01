import OpenAI from 'openai';
import Item from '../models/Item.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Gerar recomendações personalizadas baseadas na coleção do usuário
 */
export async function generateRecommendations(userId) {
  try {
    // Buscar todos os itens do usuário
    const userItems = await Item.find({ userId }).lean();

    if (userItems.length === 0) {
      return {
        recommendations: [
          'Comece sua coleção com Final Fantasy VII - um clássico atemporal!',
          'Final Fantasy X é perfeito para iniciantes na série',
          'Considere Final Fantasy XIV Online para uma experiência MMO'
        ],
        reasoning: 'Coleção vazia - sugestões para iniciantes'
      };
    }

    // Analisar padrões da coleção
    const categories = [...new Set(userItems.map(i => i.category))];
    const platforms = [...new Set(userItems.map(i => i.platform))];
    const avgRarity = userItems.reduce((sum, i) => sum + (i.rarity || 0), 0) / userItems.length;

    const prompt = `Você é um especialista em Final Fantasy. Analise esta coleção e sugira 5 itens para adicionar:

Coleção atual:
- Total de itens: ${userItems.length}
- Categorias: ${categories.join(', ')}
- Plataformas: ${platforms.join(', ')}
- Raridade média: ${avgRarity.toFixed(1)}/5
- Itens: ${userItems.slice(0, 10).map(i => i.name).join(', ')}${userItems.length > 10 ? '...' : ''}

Forneça recomendações considerando:
1. Lacunas na coleção (jogos principais faltando)
2. Itens complementares (spin-offs, merchandise)
3. Edições especiais ou raras
4. Valor de colecionador
5. Tendências de mercado

Responda em JSON:
{
  "recommendations": [
    {
      "name": "nome do item",
      "reason": "por que recomendar",
      "priority": "alta/média/baixa",
      "estimatedValue": "R$ X - Y",
      "category": "categoria"
    }
  ],
  "insights": "análise geral da coleção",
  "missingGems": ["itens raros que faltam"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Você é um especialista em colecionismo de Final Fantasy.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch[0]);

    return result;
  } catch (error) {
    console.error('Erro ao gerar recomendações:', error.message);
    return {
      recommendations: [],
      error: 'Não foi possível gerar recomendações no momento'
    };
  }
}

/**
 * Análise preditiva de valor de mercado
 */
export async function predictMarketValue(itemName, rarity, year, platform) {
  try {
    const prompt = `Como especialista em mercado de colecionáveis de Final Fantasy, estime o valor de mercado atual deste item:

Item: ${itemName}
Raridade: ${rarity}/5
Ano: ${year || 'desconhecido'}
Plataforma: ${platform}

Considere:
- Preços em marketplaces (eBay, Mercado Livre, etc.)
- Raridade e demanda
- Estado de conservação (assumir bom estado)
- Tendências de valorização

Responda em JSON:
{
  "estimatedValue": {
    "min": valor_minimo_em_reais,
    "max": valor_maximo_em_reais,
    "average": valor_medio_em_reais
  },
  "trend": "crescente/estável/decrescente",
  "reasoning": "explicação breve",
  "investmentPotential": "alto/médio/baixo"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 300
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Erro ao prever valor:', error.message);
    return null;
  }
}

/**
 * Sugerir organização inteligente da coleção
 */
export async function suggestOrganization(userId) {
  try {
    const userItems = await Item.find({ userId }).lean();

    const prompt = `Analise esta coleção de ${userItems.length} itens de Final Fantasy e sugira a melhor forma de organização:

Categorias atuais: ${[...new Set(userItems.map(i => i.category))].join(', ')}

Opções de organização:
1. Por cronologia da série (FF I → XVI)
2. Por plataforma
3. Por raridade
4. Por valor de mercado
5. Por tipo (jogos, merchandise, livros)

Responda em JSON com a melhor estratégia e justificativa:
{
  "recommendedStrategy": "estratégia principal",
  "secondarySort": "critério secundário",
  "reasoning": "por que esta organização é ideal",
  "specialSections": ["seções especiais sugeridas"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 400
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Erro ao sugerir organização:', error.message);
    return null;
  }
}

/**
 * Detectar tendências na coleção
 */
export async function analyzeCollectionTrends(userId) {
  try {
    const userItems = await Item.find({ userId }).sort({ createdAt: -1 }).lean();

    // Análise temporal
    const last30Days = userItems.filter(i => 
      new Date(i.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    const categoryDistribution = userItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const platformDistribution = userItems.reduce((acc, item) => {
      acc[item.platform] = (acc[item.platform] || 0) + 1;
      return acc;
    }, {});

    return {
      totalItems: userItems.length,
      recentAdditions: last30Days.length,
      categoryDistribution,
      platformDistribution,
      mostCollectedCategory: Object.entries(categoryDistribution)
        .sort((a, b) => b[1] - a[1])[0],
      averageRarity: (userItems.reduce((sum, i) => sum + (i.rarity || 0), 0) / userItems.length).toFixed(2),
      collectionValue: userItems.reduce((sum, i) => sum + (i.metadata?.estimatedValue || 0), 0),
      growthRate: ((last30Days.length / userItems.length) * 100).toFixed(1) + '%'
    };
  } catch (error) {
    console.error('Erro ao analisar tendências:', error.message);
    return null;
  }
}

export default {
  generateRecommendations,
  predictMarketValue,
  suggestOrganization,
  analyzeCollectionTrends
};
