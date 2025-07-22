const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const router = express.Router();

// Função para extrair ID do vídeo do YouTube
function extractYouTubeVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Função para obter informações do vídeo usando yt-dlp
async function getVideoInfo(url) {
  try {
    const { stdout } = await execAsync(`yt-dlp --dump-json "${url}"`);
    const videoInfo = JSON.parse(stdout);
    return {
      title: videoInfo.title || 'Video sem título',
      duration: videoInfo.duration || 0,
      thumbnail: videoInfo.thumbnail,
      uploader: videoInfo.uploader,
      view_count: videoInfo.view_count
    };
  } catch (error) {
    console.error('Erro ao obter informações do vídeo:', error);
    return {
      title: 'Video do YouTube',
      duration: 0
    };
  }
}

// Função para baixar vídeo usando yt-dlp
async function downloadVideo(url, outputPath, filename) {
  try {
    const command = `yt-dlp -f "best[height<=1080]" -o "${path.join(outputPath, filename)}.%(ext)s" "${url}"`;
    const { stdout, stderr } = await execAsync(command);
    
    // Encontrar o arquivo baixado
    const files = fs.readdirSync(outputPath);
    const downloadedFile = files.find(file => file.startsWith(filename));
    
    if (downloadedFile) {
      const fullPath = path.join(outputPath, downloadedFile);
      const stats = fs.statSync(fullPath);
      return {
        success: true,
        filename: downloadedFile,
        size: stats.size,
        path: fullPath
      };
    } else {
      throw new Error('Arquivo não encontrado após download');
    }
  } catch (error) {
    console.error('Erro no download:', error);
    throw error;
  }
}

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

    // Verificar se a pasta existe
    const [folderRows] = await db.execute(
      'SELECT identificacao FROM streamings WHERE codigo = ? AND (codigo_cliente = ? OR codigo = ?)',
      [id_pasta, userId, userId]
    );

    if (folderRows.length === 0) {
      return res.status(404).json({ error: 'Pasta não encontrada' });
    }

    // Verificar espaço disponível do usuário
    const [userSpaceRows] = await db.execute(
      'SELECT espaco, espaco_usado FROM streamings WHERE codigo = ? OR codigo_cliente = ?',
      [userId, userId]
    );

    let availableSpace = 1000; // MB padrão
    if (userSpaceRows.length > 0) {
      const userSpace = userSpaceRows[0];
      availableSpace = userSpace.espaco - userSpace.espaco_usado;
      
      if (availableSpace < 50) { // Mínimo 50MB
        return res.status(400).json({ 
          error: `Espaço insuficiente. Disponível: ${availableSpace}MB` 
        });
      }
    }

    // Obter informações do vídeo
    const videoInfo = await getVideoInfo(url);
    const videoId = extractYouTubeVideoId(url);
    const safeTitle = videoInfo.title
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    
    const fileName = `${safeTitle}_${videoId || Date.now()}`;
    const folderPath = `/usr/local/WowzaStreamingEngine/content/${userEmail}/${id_pasta}`;

    try {
      // Criar diretório se não existir
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Fazer download real do vídeo
      console.log(`Iniciando download do YouTube: ${url}`);
      const downloadResult = await downloadVideo(url, folderPath, fileName);
      
      if (!downloadResult.success) {
        throw new Error('Falha no download do vídeo');
      }

      // Salvar no banco de dados
      const relativePath = `/${userEmail}/${id_pasta}/${downloadResult.filename}`;
      const fileSizeMB = Math.ceil(downloadResult.size / (1024 * 1024));
      
      const [result] = await db.execute(
        `INSERT INTO playlists_videos (
          codigo_playlist, path_video, video, width, height,
          bitrate, duracao, duracao_segundos, tipo, ordem
        ) VALUES (0, ?, ?, 1920, 1080, 2500, ?, ?, 'video', 0)`,
        [
          relativePath, 
          videoInfo.title,
          formatDuration(videoInfo.duration),
          videoInfo.duration
        ]
      );

      // Atualizar espaço usado do usuário
      if (userSpaceRows.length > 0) {
        await db.execute(
          'UPDATE streamings SET espaco_usado = espaco_usado + ? WHERE codigo = ? OR codigo_cliente = ?',
          [fileSizeMB, userId, userId]
        );
      }

      res.json({
        success: true,
        message: `Vídeo "${videoInfo.title}" baixado com sucesso!`,
        video: {
          id: result.insertId,
          nome: videoInfo.title,
          url: `/content${relativePath}`,
          duracao: videoInfo.duration,
          tamanho: downloadResult.size
        }
      });
    } catch (fileError) {
      console.error('Erro ao criar arquivo:', fileError);
      return res.status(500).json({ 
        error: 'Erro ao baixar vídeo', 
        details: fileError.message 
      });
    }
  } catch (err) {
    console.error('Erro no download do YouTube:', err);
    res.status(500).json({ error: 'Erro no download do YouTube', details: err.message });
  }
});

// Função auxiliar para formatar duração
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

module.exports = router;