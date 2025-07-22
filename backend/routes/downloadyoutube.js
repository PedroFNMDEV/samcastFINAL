const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// POST /api/downloadyoutube - Download de vídeo do YouTube
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { url, id_pasta } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email.split('@')[0];

    if (!url || !id_pasta) {
      return res.status(400).json({ error: 'URL e pasta são obrigatórios' });
    }

    // Validar URL do YouTube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(url)) {
      return res.status(400).json({ error: 'URL deve ser do YouTube' });
    }

    // Simular download (em produção, usar youtube-dl ou similar)
    const videoTitle = `Video_${Date.now()}`;
    const fileName = `${videoTitle}.mp4`;
    const folderPath = `/usr/local/WowzaStreamingEngine/content/${userEmail}/${id_pasta}`;
    const filePath = path.join(folderPath, fileName);

    try {
      // Criar diretório se não existir
      await fs.mkdir(folderPath, { recursive: true });

      // Simular criação do arquivo (em produção, fazer download real)
      await fs.writeFile(filePath, 'video content placeholder');

      // Salvar no banco de dados
      const relativePath = `/${userEmail}/${id_pasta}/${fileName}`;
      const [result] = await db.execute(
        `INSERT INTO playlists_videos (
          codigo_playlist, path_video, video, width, height,
          bitrate, duracao, duracao_segundos, tipo, ordem
        ) VALUES (0, ?, ?, 1920, 1080, 2500, '00:03:30', 210, 'video', 0)`,
        [relativePath, videoTitle]
      );

      res.json({
        success: true,
        message: `Vídeo "${videoTitle}" baixado com sucesso!`,
        video: {
          id: result.insertId,
          nome: videoTitle,
          url: `/content${relativePath}`,
          duracao: 210,
          tamanho: 1024 * 1024 // 1MB placeholder
        }
      });
    } catch (fileError) {
      console.error('Erro ao criar arquivo:', fileError);
      return res.status(500).json({ error: 'Erro ao salvar vídeo' });
    }
  } catch (err) {
    console.error('Erro no download do YouTube:', err);
    res.status(500).json({ error: 'Erro no download do YouTube', details: err.message });
  }
});

module.exports = router;