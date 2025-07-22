const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/folders - Lista pastas do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar pastas do usuário na tabela streamings
    const [rows] = await db.execute(
      `SELECT 
        codigo as id,
        identificacao as nome
       FROM streamings 
       WHERE codigo_cliente = ? AND status = 1`,
      [userId]
    );

    // Se não houver pastas, criar uma pasta padrão
    if (rows.length === 0) {
      const userEmail = req.user.email.split('@')[0];
      res.json([{ id: 1, nome: userEmail }]);
    } else {
      res.json(rows);
    }
  } catch (err) {
    console.error('Erro ao buscar pastas:', err);
    res.status(500).json({ error: 'Erro ao buscar pastas', details: err.message });
  }
});

// POST /api/folders - Cria nova pasta
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome da pasta é obrigatório' });
    
    const userId = req.user.id;
    const userEmail = req.user.email.split('@')[0];

    // Criar entrada na tabela streamings para representar a pasta
    const [result] = await db.execute(
      `INSERT INTO streamings (
        codigo_cliente, codigo_servidor, login, senha, senha_transmissao,
        espectadores, bitrate, espaco, ftp_dir, identificacao, email,
        data_cadastro, aplicacao, status
      ) VALUES (?, 1, ?, '', '', 100, 2500, 1000, ?, ?, ?, NOW(), 'live', 1)`,
      [userId, userEmail, `/${userEmail}/${nome}`, nome, req.user.email]
    );

    res.status(201).json({
      id: result.insertId,
      nome: nome
    });
  } catch (err) {
    console.error('Erro ao criar pasta:', err);
    res.status(500).json({ error: 'Erro ao criar pasta', details: err.message });
  }
});

// DELETE /api/folders/:id - Remove pasta
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const folderId = req.params.id;
    const userId = req.user.id;

    // Verificar se a pasta pertence ao usuário
    const [folderRows] = await db.execute(
      'SELECT codigo FROM streamings WHERE codigo = ? AND codigo_cliente = ?',
      [folderId, userId]
    );

    if (folderRows.length === 0) {
      return res.status(404).json({ error: 'Pasta não encontrada' });
    }

    // Verificar se há vídeos na pasta
    const [videoRows] = await db.execute(
      'SELECT COUNT(*) as count FROM playlists_videos WHERE path_video LIKE ?',
      [`%/${folderId}/%`]
    );

    if (videoRows[0].count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir pasta que contém vídeos',
        details: 'Remova todos os vídeos da pasta antes de excluí-la'
      });
    }

    // Remover pasta
    await db.execute(
      'DELETE FROM streamings WHERE codigo = ? AND codigo_cliente = ?',
      [folderId, userId]
    );

    res.json({ success: true, message: 'Pasta removida com sucesso' });
  } catch (err) {
    console.error('Erro ao remover pasta:', err);
    res.status(500).json({ error: 'Erro ao remover pasta', details: err.message });
  }
});

module.exports = router;