/**
 * Middleware global de tratamento de erros
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  // Erro de cast do Mongoose (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'ID inválido'
    });
  }

  // Erro de duplicata (unique constraint)
  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Registro duplicado',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado'
    });
  }

  // Erro de upload
  if (err.message === 'Apenas imagens são permitidas') {
    return res.status(400).json({
      error: err.message
    });
  }

  // Erro genérico
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
