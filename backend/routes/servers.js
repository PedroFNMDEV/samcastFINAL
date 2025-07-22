const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/servers - Lista servidores disponíveis
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
        codigo as id,
        nome,
        ip,
        porta_ssh,
        status,
        limite_streamings,
        \`load\`,
        tipo
       FROM servidores 
       WHERE status = 'on' AND exibir = 'sim'
       ORDER BY ordem, nome`
    );

    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar servidores:', err);
    res.status(500).json({ error: 'Erro ao buscar servidores', details: err.message });
  }
});

// GET /api/servers/:id - Detalhes de um servidor
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const serverId = req.params.id;

    const [rows] = await db.execute(
      `SELECT 
        codigo as id,
        nome,
        ip,
        porta_ssh,
        status,
        limite_streamings,
        \`load\`,
        trafego,
        trafego_out,
        tipo,
        mensagem_manutencao
       FROM servidores 
       WHERE codigo = ?`,
      [serverId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar servidor:', err);
    res.status(500).json({ error: 'Erro ao buscar servidor', details: err.message });
  }
});

module.exports = router;
