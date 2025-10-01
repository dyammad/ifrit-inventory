import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'premium'],
    default: 'user'
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'trial'],
      default: 'active'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date
  },
  preferences: {
    language: { type: String, default: 'pt-BR' },
    theme: { type: String, default: 'dark' },
    notifications: { type: Boolean, default: true },
    aiAssistant: { type: Boolean, default: true }
  },
  usage: {
    itemsCount: { type: Number, default: 0 },
    aiRequestsThisMonth: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 } // em bytes
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Método para comparar senha
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para verificar limites do plano
userSchema.methods.canAddItem = function() {
  const limits = {
    free: 50,
    basic: 500,
    premium: 5000,
    enterprise: Infinity
  };
  return this.usage.itemsCount < limits[this.subscription.plan];
};

userSchema.methods.canUseAI = function() {
  const limits = {
    free: 10,
    basic: 100,
    premium: 1000,
    enterprise: Infinity
  };
  return this.usage.aiRequestsThisMonth < limits[this.subscription.plan];
};

export default mongoose.model('User', userSchema);
