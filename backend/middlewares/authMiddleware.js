const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Buscar usuário no banco
      const [rows] = await db.execute(
        'SELECT codigo, nome, email, streamings, espectadores, bitrate, espaco, status FROM revendas WHERE codigo = ? AND status = 1',
        [decoded.userId]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
      }

      const user = rows[0];
      req.user = {
        id: user.codigo,
        nome: user.nome,
        email: user.email,
        streamings: user.streamings,
        espectadores: user.espectadores,
        bitrate: user.bitrate,
        espaco: user.espaco
      };

      next();
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = authMiddleware;