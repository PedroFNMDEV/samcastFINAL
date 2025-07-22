const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Configuração do multer para upload de vídeos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email.split('@')[0];
      const folderId = req.query.folder_id || 'default';
      
      // Caminho no Wowza: /usr/local/WowzaStreamingEngine/content/{userEmail}/{folderId}/
      const wowzaPath = `/usr/local/WowzaStreamingEngine/content/${userEmail}/${folderId}`;
      
      // Criar diretório se não existir
      await fs.mkdir(wowzaPath, { recursive: true });
      
      cb(null, wowzaPath);
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
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 
      'video/flv', 'video/webm', 'video/mkv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

// GET /api/videos - Lista vídeos por pasta
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const folderId = req.query.folder_id;
    
    if (!folderId) {
      return res.status(400).json({ error: 'folder_id é obrigatório' });
    }

    const userEmail = req.user.email.split('@')[0];
    const folderPath = `/${userEmail}/${folderId}/`;

    const [rows] = await db.execute(
      `SELECT 
        codigo as id,
        video as nome,
        path_video as url,
        duracao_segundos as duracao,
        CHAR_LENGTH(video) * 1024 as tamanho
       FROM playlists_videos 
       WHERE path_video LIKE ?
       ORDER BY codigo`,
      [`%${folderPath}%`]
    );

    // Ajustar URLs para serem acessíveis via HTTP
    const videos = rows.map(video => ({
      ...video,
      url: video.url ? `/content${video.url}` : null
    }));

    res.json(videos);
  } catch (err) {
    console.error('Erro ao buscar vídeos:', err);
    res.status(500).json({ error: 'Erro ao buscar vídeos', details: err.message });
  }
});

// POST /api/videos/upload - Upload de vídeo
router.post('/upload', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const userId = req.user.id;
    const userEmail = req.user.email.split('@')[0];
    const folderId = req.query.folder_id || 'default';
    const duracao = parseInt(req.body.duracao) || 0;
    const tamanho = parseInt(req.body.tamanho) || req.file.size;

    // Caminho relativo para salvar no banco
    const relativePath = `/${userEmail}/${folderId}/${req.file.filename}`;

    // Inserir vídeo na tabela playlists_videos
    const [result] = await db.execute(
      `INSERT INTO playlists_videos (
        codigo_playlist, path_video, video, width, height, 
        bitrate, duracao, duracao_segundos, tipo, ordem
      ) VALUES (0, ?, ?, 1920, 1080, 2500, ?, ?, 'video', 0)`,
      [relativePath, req.file.originalname, '00:00:00', duracao]
    );

    // Atualizar espaço usado do usuário
    const spaceMB = Math.ceil(tamanho / (1024 * 1024));
    await db.execute(
      'UPDATE revendas SET espaco = espaco - ? WHERE codigo = ?',
      [spaceMB, userId]
    );

    res.status(201).json({
      id: result.insertId,
      nome: req.file.originalname,
      url: `/content${relativePath}`,
      duracao: duracao,
      tamanho: tamanho
    });
  } catch (err) {
    console.error('Erro no upload:', err);
    res.status(500).json({ error: 'Erro no upload do vídeo', details: err.message });
  }
});

// DELETE /api/videos/:id - Remove vídeo
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;

    // Buscar vídeo
    const [videoRows] = await db.execute(
      'SELECT path_video, video FROM playlists_videos WHERE codigo = ?',
      [videoId]
    );

    if (videoRows.length === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    const video = videoRows[0];
    const userEmail = req.user.email.split('@')[0];

    // Verificar se o vídeo pertence ao usuário
    if (!video.path_video.includes(`/${userEmail}/`)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Remover arquivo físico
    try {
      const fullPath = `/usr/local/WowzaStreamingEngine/content${video.path_video}`;
      await fs.unlink(fullPath);
    } catch (fileError) {
      console.warn('Erro ao remover arquivo físico:', fileError.message);
    }

    // Remover do banco
    await db.execute(
      'DELETE FROM playlists_videos WHERE codigo = ?',
      [videoId]
    );

    res.json({ success: true, message: 'Vídeo removido com sucesso' });
  } catch (err) {
    console.error('Erro ao remover vídeo:', err);
    res.status(500).json({ error: 'Erro ao remover vídeo', details: err.message });
  }
});

module.exports = router;