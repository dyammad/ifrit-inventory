import OpenAI from 'openai';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Reconhecimento de imagem usando GPT-4 Vision
 * Identifica jogos/itens de Final Fantasy por foto
 */
export async function analyzeGameImage(imageBuffer) {
  try {
    // Otimizar imagem
    const optimizedImage = await sharp(imageBuffer)
      .resize(1024, 1024, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();

    const base64Image = optimizedImage.toString('base64');

    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analise esta imagem e identifique:
1. Nome do jogo/item de Final Fantasy
2. Plataforma (PS1, PS2, PS3, PS4, PS5, Switch, PC, Xbox, etc.)
3. Categoria (qual Final Fantasy: I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, XIII, XIV, XV, XVI, Spin-off, Merchandise, Livro)
4. Ano de lançamento (se visível)
5. Edição especial ou detalhes (Standard, Deluxe, Collector's, etc.)
6. Estado/condição (se visível)
7. Raridade estimada (0-5, onde 5 é extremamente raro)
8. Tags relevantes

Responda APENAS em formato JSON válido:
{
  "name": "nome do item",
  "platform": "plataforma",
  "category": "categoria",
  "year": ano,
  "notes": "detalhes adicionais",
  "rarity": número,
  "tags": ["tag1", "tag2"],
  "confidence": 0.95
}`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Resposta da IA não está em formato JSON válido');
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      success: true,
      data: result,
      method: 'gpt-4-vision'
    };
  } catch (error) {
    console.error('Erro no GPT-4 Vision:', error.message);
    
    // Fallback para OCR se Vision falhar
    return await analyzeWithOCR(imageBuffer);
  }
}

/**
 * Fallback: OCR usando Tesseract
 */
async function analyzeWithOCR(imageBuffer) {
  try {
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng+por');
    
    // Usar GPT para interpretar o texto extraído
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em jogos Final Fantasy. Analise o texto extraído de uma capa/item e identifique os detalhes.'
        },
        {
          role: 'user',
          content: `Texto extraído: "${text}"\n\nIdentifique o jogo/item de Final Fantasy e retorne JSON com: name, platform, category, year, notes, rarity (0-5), tags, confidence (0-1)`
        }
      ],
      max_tokens: 300
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data: result,
      method: 'ocr',
      extractedText: text
    };
  } catch (error) {
    console.error('Erro no OCR:', error.message);
    return {
      success: false,
      error: 'Não foi possível identificar o item automaticamente',
      method: 'failed'
    };
  }
}

/**
 * Buscar informações adicionais na IGDB API
 */
export async function enrichWithIGDB(gameName) {
  try {
    // Obter token de acesso
    const authResponse = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`
    );
    
    const accessToken = authResponse.data.access_token;

    // Buscar jogo
    const response = await axios.post(
      'https://api.igdb.com/v4/games',
      `search "${gameName}"; fields name,summary,release_dates.y,platforms.name,cover.url,rating,genres.name; limit 1;`,
      {
        headers: {
          'Client-ID': process.env.IGDB_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (response.data.length > 0) {
      const game = response.data[0];
      return {
        igdbId: game.id,
        summary: game.summary,
        year: game.release_dates?.[0]?.y,
        rating: game.rating,
        genres: game.genres?.map(g => g.name),
        coverUrl: game.cover?.url?.replace('t_thumb', 't_cover_big')
      };
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar na IGDB:', error.message);
    return null;
  }
}

/**
 * Detectar duplicatas usando embeddings
 */
export async function findSimilarItems(itemName, existingItems) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: itemName
    });

    const newEmbedding = response.data[0].embedding;
    
    // Calcular similaridade com itens existentes
    const similarities = existingItems.map(item => {
      const similarity = cosineSimilarity(newEmbedding, item.embedding);
      return { item, similarity };
    });

    // Retornar itens com similaridade > 0.9 (possíveis duplicatas)
    return similarities
      .filter(s => s.similarity > 0.9)
      .sort((a, b) => b.similarity - a.similarity)
      .map(s => ({ ...s.item, similarity: s.similarity }));
  } catch (error) {
    console.error('Erro ao buscar similares:', error.message);
    return [];
  }
}

function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export default {
  analyzeGameImage,
  enrichWithIGDB,
  findSimilarItems
};
