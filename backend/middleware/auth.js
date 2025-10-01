import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware de autenticação
 */
export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

/**
 * Middleware para verificar limite de uso de IA
 */
export async function checkAILimit(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);

    if (!user.canUseAI()) {
      return res.status(403).json({
        error: 'Limite de requisições de IA atingido para este mês',
        plan: user.subscription.plan,
        usage: user.usage.aiRequestsThisMonth,
        upgradeUrl: '/api/subscription/upgrade'
      });
    }

    // Incrementar contador
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { 'usage.aiRequestsThisMonth': 1 }
    });

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Middleware para verificar se é admin
 */
export async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado: apenas administradores' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Middleware para verificar plano premium
 */
export async function requirePremium(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);

    if (!['premium', 'enterprise'].includes(user.subscription.plan)) {
      return res.status(403).json({
        error: 'Este recurso requer plano Premium ou Enterprise',
        currentPlan: user.subscription.plan,
        upgradeUrl: '/api/subscription/upgrade'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
