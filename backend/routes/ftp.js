const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');
const fs = require('fs');
const path = require('path');
const { Client } = require('basic-ftp');

const router = express.Router();

// Função para conectar ao FTP
async function connectFTP(ftpConfig) {
  const client = new Client();
  client.ftp.verbose = false;
  
  try {
    await client.access({
      host: ftpConfig.ip,
      port: ftpConfig.porta || 21,
      user: ftpConfig.usuario,
      password: ftpConfig.senha,
      secure: false
    });
    
    return client;
  } catch (error) {
    console.error('Erro ao conectar FTP:', error);
    throw error;
  }
}

// Função para listar arquivos de um diretório
async function listFTPFiles(client, directory = '/') {
  try {
    const files = await client.list(directory);
    
    return files.map(file => ({
      name: file.name,
      size: file.size || 0,
      type: file.isDirectory ? 'directory' : 'file',
      path: path.posix.join(directory, file.name),
      isVideo: file.isFile && /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/i.test(file.name)
    }));
  } catch (error) {
    console.error('Erro ao listar arquivos FTP:', error);
    throw error;
  }
}

// Função para escanear diretório recursivamente
async function scanDirectoryRecursive(client, directory, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return [];
  
  const videos = [];
  
  try {
    const files = await client.list(directory);
    
    for (const file of files) {
      const filePath = path.posix.join(directory, file.name);
      
      if (file.isDirectory && file.name !== '.' && file.name !== '..') {
        // Recursivamente escanear subdiretórios
        const subVideos = await scanDirectoryRecursive(client, filePath, maxDepth, currentDepth + 1);
        videos.push(...subVideos);
      } else if (file.isFile && /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/i.test(file.name)) {
        videos.push({
          name: file.name,
          path: filePath,
          size: file.size || 0,
          directory: directory
        });
      }
    }
  } catch (error) {
    console.error(`Erro ao escanear diretório ${directory}:`, error);
  }
  
  return videos;
}

// Função para baixar arquivo via FTP
async function downloadFTPFile(client, remotePath, localPath) {
  try {
    // Criar diretório local se não existir
    const localDir = path.dirname(localPath);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    
    await client.downloadTo(localPath, remotePath);
    
    // Verificar se arquivo foi baixado
    if (fs.existsSync(localPath)) {
      const stats = fs.statSync(localPath);
      return {
        success: true,
        size: stats.size,
        path: localPath
      };
    } else {
      throw new Error('Arquivo não foi criado');
    }
  } catch (error) {
    console.error('Erro ao baixar arquivo FTP:', error);
    throw error;
  }
}

// POST /api/ftp/connect - Conecta ao FTP
router.post('/connect', authMiddleware, async (req, res) => {
  try {
    const { ip, usuario, senha, porta } = req.body;

    if (!ip || !usuario || !senha) {
      return res.status(400).json({
        success: false,
        error: 'IP, usuário e senha são obrigatórios'
      });
    }

    try {
      const client = await connectFTP({ ip, usuario, senha, porta: porta || 21 });
      const files = await listFTPFiles(client, '/');
      await client.close();

      res.json({
        success: true,
        files: files,
        currentPath: '/'
      });
    } catch (ftpError) {
      console.error('Erro de conexão FTP:', ftpError);
      res.status(400).json({
        success: false,
        error: 'Erro ao conectar ao servidor FTP: ' + ftpError.message
      });
    }

  } catch (error) {
    console.error('Erro ao conectar FTP:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao conectar ao servidor FTP'
    });
  }
});

// POST /api/ftp/list - Lista arquivos de um diretório
router.post('/list', authMiddleware, async (req, res) => {
  try {
    const { ip, usuario, senha, porta, path: directoryPath } = req.body;

    try {
      const client = await connectFTP({ ip, usuario, senha, porta: porta || 21 });
      const files = await listFTPFiles(client, directoryPath || '/');
      await client.close();

      res.json({
        success: true,
        files: files,
        currentPath: directoryPath || '/'
      });
    } catch (ftpError) {
      console.error('Erro ao listar diretório FTP:', ftpError);
      res.status(400).json({
        success: false,
        error: 'Erro ao listar diretório: ' + ftpError.message
      });
    }

  } catch (error) {
    console.error('Erro ao listar diretório:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar diretório'
    });
  }
});

// POST /api/ftp/scan-directory - Escaneia diretório recursivamente
router.post('/scan-directory', authMiddleware, async (req, res) => {
  try {
    const { ftpConnection, directoryPath } = req.body;

    try {
      const client = await connectFTP(ftpConnection);
      const videos = await scanDirectoryRecursive(client, directoryPath);
      await client.close();

      res.json({
        success: true,
        videos: videos
      });
    } catch (ftpError) {
      console.error('Erro ao escanear diretório FTP:', ftpError);
      res.status(400).json({
        success: false,
        error: 'Erro ao escanear diretório: ' + ftpError.message
      });
    }

  } catch (error) {
    console.error('Erro ao escanear diretório:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao escanear diretório'
    });
  }
});

// POST /api/ftp/migrate - Migra arquivos do FTP
router.post('/migrate', authMiddleware, async (req, res) => {
  try {
    const { ftpConnection, files, destinationFolder } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email.split('@')[0];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo selecionado'
      });
    }

    // Verificar se a pasta de destino existe
    const [folderRows] = await db.execute(
      'SELECT identificacao FROM streamings WHERE codigo = ? AND (codigo_cliente = ? OR codigo = ?)',
      [destinationFolder, userId, userId]
    );

    if (folderRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pasta de destino não encontrada'
      });
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
    }

    let migratedFiles = 0;
    const errors = [];
    let totalSizeMB = 0;

    try {
      const client = await connectFTP(ftpConnection);
      
      for (const filePath of files) {
        try {
          const fileName = path.basename(filePath);
          const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
          const localDir = `/usr/local/WowzaStreamingEngine/content/${userEmail}/${destinationFolder}`;
          const localPath = path.join(localDir, `${Date.now()}_${safeFileName}`);
          
          // Verificar espaço antes do download
          const fileSizeInfo = await client.size(filePath);
          const fileSizeMB = Math.ceil((fileSizeInfo || 0) / (1024 * 1024));
          
          if (totalSizeMB + fileSizeMB > availableSpace) {
            errors.push(`Espaço insuficiente para ${fileName}`);
            continue;
          }
          
          // Fazer download do arquivo
          const downloadResult = await downloadFTPFile(client, filePath, localPath);
          
          if (downloadResult.success) {
            // Salvar no banco de dados
            const relativePath = `/${userEmail}/${destinationFolder}/${path.basename(localPath)}`;
            const actualSizeMB = Math.ceil(downloadResult.size / (1024 * 1024));
            
            await db.execute(
              `INSERT INTO playlists_videos (
                codigo_playlist, path_video, video, width, height,
                bitrate, duracao, duracao_segundos, tipo, ordem
              ) VALUES (0, ?, ?, 1920, 1080, 2500, '00:00:00', 0, 'video', 0)`,
              [relativePath, fileName]
            );
            
            // Atualizar espaço usado
            if (userSpaceRows.length > 0) {
              await db.execute(
                'UPDATE streamings SET espaco_usado = espaco_usado + ? WHERE codigo = ? OR codigo_cliente = ?',
                [actualSizeMB, userId, userId]
              );
            }
            
            migratedFiles++;
            totalSizeMB += actualSizeMB;
            
            console.log(`Arquivo migrado com sucesso: ${fileName}`);
          } else {
            errors.push(`Erro ao baixar ${fileName}`);
          }
        } catch (fileError) {
          console.error(`Erro ao migrar ${filePath}:`, fileError);
          errors.push(`Erro ao migrar ${path.basename(filePath)}: ${fileError.message}`);
        }
      }
      
      await client.close();
    } catch (ftpError) {
      console.error('Erro de conexão FTP durante migração:', ftpError);
      return res.status(400).json({
        success: false,
        error: 'Erro de conexão FTP: ' + ftpError.message
      });
    }

    res.json({
      success: true,
      migratedFiles,
      totalFiles: files.length,
      errors,
      totalSizeMB
    });

  } catch (error) {
    console.error('Erro na migração:', error);
    res.status(500).json({
      success: false,
      error: 'Erro durante a migração'
    });
  }
});

module.exports = router;