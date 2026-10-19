const express = require('express');
const { searchMedia } = require('../services/media');

const router = express.Router();
const VALID_TYPES = ['movie', 'tv', 'game'];

// GET /search?q=matrix&type=movie
router.get('/', async (req, res) => {
  const { q, type } = req.query;

  if (!q || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: 'Informe q e um type válido (movie, tv ou game).' });
  }

  try {
    const items = await searchMedia(q, type);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(502).json({ message: 'Falha ao consultar a API externa.' });
  }
});

module.exports = router;
