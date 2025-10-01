import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Final Fantasy I', 'Final Fantasy II', 'Final Fantasy III',
      'Final Fantasy IV', 'Final Fantasy V', 'Final Fantasy VI',
      'Final Fantasy VII', 'Final Fantasy VIII', 'Final Fantasy IX',
      'Final Fantasy X', 'Final Fantasy XI', 'Final Fantasy XII',
      'Final Fantasy XIII', 'Final Fantasy XIV', 'Final Fantasy XV',
      'Final Fantasy XVI', 'Spin-offs', 'Merchandise', 'Livros', 'Outros'
    ]
  },
  platform: {
    type: String,
    enum: ['PS1', 'PS2', 'PS3', 'PS4', 'PS5', 'Switch', 'PC', 'Xbox', 'Mobile', 'Livro', 'Merch', 'Outro']
  },
  rarity: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  year: Number,
  notes: String,
  image: {
    url: String,
    thumbnail: String,
    size: Number
  },
  metadata: {
    igdbId: String,
    detectedBy: {
      type: String,
      enum: ['manual', 'ai-vision', 'ai-ocr', 'api'],
      default: 'manual'
    },
    confidence: Number, // 0-1
    tags: [String],
    estimatedValue: Number
  },
  aiInsights: {
    recommendations: [String],
    similarItems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    }],
    marketTrends: String,
    lastAnalyzed: Date
  },
  status: {
    type: String,
    enum: ['owned', 'wishlist', 'sold', 'traded'],
    default: 'owned'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, {
  timestamps: true
});

// Índices para performance
itemSchema.index({ userId: 1, category: 1 });
itemSchema.index({ userId: 1, name: 'text', notes: 'text' });
itemSchema.index({ 'metadata.tags': 1 });

export default mongoose.model('Item', itemSchema);
