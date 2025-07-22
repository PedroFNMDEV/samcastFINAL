const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário por email
    const [rows] = await db.execute(
      'SELECT codigo, nome, email, senha, streamings, espectadores, bitrate, espaco, status FROM revendas WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = rows[0];

    if (user.status !== 1) {
      return res.status(401).json({ error: 'Conta desativada' });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.senha);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar último acesso
    await db.execute(
      'UPDATE revendas SET ultimo_acesso_data = NOW(), ultimo_acesso_ip = ? WHERE codigo = ?',
      [req.ip, user.codigo]
    );

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.codigo, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.codigo,
        nome: user.nome,
        email: user.email,
        streamings: user.streamings,
        espectadores: user.espectadores,
        bitrate: user.bitrate,
        espaco: user.espaco
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    // Verificar se email já existe
    const [existingUser] = await db.execute(
      'SELECT codigo FROM revendas WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Gerar ID único
    const userId = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Inserir novo usuário
    const [result] = await db.execute(
      `INSERT INTO revendas (
        codigo_revenda, id, nome, email, senha, streamings, espectadores, 
        bitrate, espaco, subrevendas, chave_api, status, data_cadastro, 
        dominio_padrao, ultimo_acesso_data, ultimo_acesso_ip
      ) VALUES (0, ?, ?, ?, ?, 1, 100, 2500, 5, 0, '', 1, NOW(), '', NOW(), ?)`,
      [userId, nome, email, hashedPassword, req.ip]
    );

    // Buscar usuário criado
    const [newUser] = await db.execute(
      'SELECT codigo, nome, email, streamings, espectadores, bitrate, espaco FROM revendas WHERE codigo = ?',
      [result.insertId]
    );

    const user = newUser[0];

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.codigo, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.codigo,
        nome: user.nome,
        email: user.email,
        streamings: user.streamings,
        espectadores: user.espectadores,
        bitrate: user.bitrate,
        espaco: user.espaco
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Verificar se usuário existe
    const [rows] = await db.execute(
      'SELECT codigo, nome FROM revendas WHERE email = ? AND status = 1',
      [email]
    );

    if (rows.length === 0) {
      // Por segurança, sempre retornar sucesso mesmo se email não existir
      return res.json({ success: true, message: 'Se o email existir, você receberá instruções para redefinir a senha' });
    }

    // Aqui você implementaria o envio de email
    // Por enquanto, apenas simular sucesso
    res.json({ success: true, message: 'Instruções enviadas para seu email' });
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const [rows] = await db.execute(
      'SELECT codigo, nome, email, streamings, espectadores, bitrate, espaco FROM revendas WHERE codigo = ? AND status = 1',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const user = rows[0];
    res.json({
      id: user.codigo,
      nome: user.nome,
      email: user.email,
      streamings: user.streamings,
      espectadores: user.espectadores,
      bitrate: user.bitrate,
      espaco: user.espaco
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;