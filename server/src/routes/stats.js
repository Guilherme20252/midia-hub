const { translateGenre } = require('../services/genres');
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middlewares/auth');

const router = express.Router();
router.use(auth);

// GET /stats
router.get('/', async (req, res) => {
  try {
    const items = await prisma.libraryItem.findMany({
      where: { userId: req.userId },
      select: { type: true, status: true, rating: true, genres: true },
    });

    const byType = { movie: 0, tv: 0, game: 0 };
    const byStatus = { want: 0, in_progress: 0, done: 0 };
    const genreCount = {};
    let ratingSum = 0;
    let ratingCount = 0;

    for (const item of items) {
      if (item.type in byType) byType[item.type]++;
      if (item.status in byStatus) byStatus[item.status]++;

      if (item.rating !== null) {
        ratingSum += item.rating;
        ratingCount++;
      }

      for (const genre of item.genres) {
        const name = translateGenre(genre);
        genreCount[name] = (genreCount[name] || 0) + 1;
      }
    }

    const topGenres = Object.entries(genreCount)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      total: items.length,
      byType,
      byStatus,
      averageRating: ratingCount ? Number((ratingSum / ratingCount).toFixed(1)) : null,
      topGenres,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao calcular as estatísticas.' });
  }
});

module.exports = router;
