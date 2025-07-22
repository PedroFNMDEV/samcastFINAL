const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Configuração do multer para upload de logos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email.split('@')[0];
      
      // Caminho para logos: /usr/local/WowzaStreamingEngine/content/{userEmail}/logos/
      const logoPath = `/usr/local/WowzaStreamingEngine/content/${userEmail}/logos`;
      
      // Criar diretório se não existir
      await fs.mkdir(logoPath, { recursive: true });
      
      cb(null, logoPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Sanitizar nome do arquivo
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_');
    
    cb(null, `${Date.now()}_${sanitizedName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

// GET /api/logos - Lista logos do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email.split('@')[0];

    const [rows] = await db.execute(
      `SELECT 
        codigo as id,
        nome,
        arquivo as url,
        tamanho,
        tipo_arquivo,
        data_upload as created_at
       FROM logos 
       WHERE codigo_stm = ?
       ORDER BY data_upload DESC`,
      [userId]
    );

    // Ajustar URLs para serem acessíveis via HTTP
    const logos = rows.map(logo => ({
      ...logo,
      url: logo.url ? `/content/${userEmail}/logos/${path.basename(logo.url)}` : null
    }));

    res.json(logos);
  } catch (err) {
    console.error('Erro ao buscar logos:', err);
    res.status(500).json({ error: 'Erro ao buscar logos', details: err.message });
  }
});

// POST /api/logos - Upload de logo
router.post('/', authMiddleware, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { nome } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email.split('@')[0];

    if (!nome) {
      return res.status(400).json({ error: 'Nome da logo é obrigatório' });
    }

    // Caminho relativo para salvar no banco
    const relativePath = `/logos/${req.file.filename}`;

    // Inserir logo na tabela
    const [result] = await db.execute(
      `INSERT INTO logos (
        codigo_stm, nome, arquivo, tamanho, tipo_arquivo, data_upload
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, nome, relativePath, req.file.size, req.file.mimetype]
    );

    res.status(201).json({
      id: result.insertId,
      nome: nome,
      url: `/content/${userEmail}/logos/${req.file.filename}`,
      tamanho: req.file.size,
      tipo_arquivo: req.file.mimetype
    });
  } catch (err) {
    console.error('Erro no upload da logo:', err);
    res.status(500).json({ error: 'Erro no upload da logo', details: err.message });
  }
});

// DELETE /api/logos/:id - Remove logo
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const logoId = req.params.id;
    const userId = req.user.id;

    // Buscar logo
    const [logoRows] = await db.execute(
      'SELECT arquivo FROM logos WHERE codigo = ? AND codigo_stm = ?',
      [logoId, userId]
    );

    if (logoRows.length === 0) {
      return res.status(404).json({ error: 'Logo não encontrada' });
    }

    const logo = logoRows[0];
    const userEmail = req.user.email.split('@')[0];

    // Remover arquivo físico
    try {
      const fullPath = `/usr/local/WowzaStreamingEngine/content/${userEmail}${logo.arquivo}`;
      await fs.unlink(fullPath);
    } catch (fileError) {
      console.warn('Erro ao remover arquivo físico:', fileError.message);
    }

    // Remover do banco
    await db.execute(
      'DELETE FROM logos WHERE codigo = ?',
      [logoId]
    );

    res.json({ success: true, message: 'Logo removida com sucesso' });
  } catch (err) {
    console.error('Erro ao remover logo:', err);
    res.status(500).json({ error: 'Erro ao remover logo', details: err.message });
  }
});

module.exports = router;