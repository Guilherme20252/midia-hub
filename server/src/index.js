require('dotenv').config();
const express = require('express');
const cors = require('cors');
const searchRoutes = require('./routes/search');
const authRoutes = require('./routes/auth');
const libraryRoutes = require('./routes/library');
const statsRoutes = require('./routes/stats');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/auth', authRoutes);
app.use('/library', libraryRoutes);
app.use('/stats', statsRoutes);
app.use('/search', searchRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));