const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const auth = require('../middlewares/auth');

const router = express.Router();
router.use(auth); // todas as rotas daqui exigem login

const TYPES = ['movie', 'tv', 'game'];
const STATUSES = ['want', 'in_progress', 'done'];

const createSchema = z.object({
  externalId: z.string().min(1),
  type: z.enum(TYPES),
  title: z.string().min(1),
  posterUrl: z.string().optional().default(''),
  genres: z.array(z.string()).optional().default([]),
  status: z.enum(STATUSES).optional().default('want'),
  rating: z.number().int().min(1).max(10).nullable().optional(),
  review: z.string().max(1000).nullable().optional(),
});

const updateSchema = z
  .object({
    status: z.enum(STATUSES),
    rating: z.number().int().min(1).max(10).nullable(),
    review: z.string().max(1000).nullable(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Envie ao menos um campo para atualizar.',
  });

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /library?status=done&type=game
router.get('/', async (req, res) => {
  const { status, type } = req.query;
  const where = { userId: req.userId };
  if (STATUSES.includes(status)) where.status = status;
  if (TYPES.includes(type)) where.type = type;

  try {
    const items = await prisma.libraryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar a biblioteca.' });
  }
});

// POST /library
router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const data = parsed.data;

  try {
    const exists = await prisma.libraryItem.findUnique({
      where: {
        userId_externalId_type: {
          userId: req.userId,
          externalId: data.externalId,
          type: data.type,
        },
      },
    });
    if (exists) {
      return res.status(409).json({ message: 'Esse item já está na sua biblioteca.' });
    }

    const item = await prisma.libraryItem.create({
      data: { ...data, userId: req.userId },
    });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao adicionar o item.' });
  }
});

// PUT /library/:id
router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido.' });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  try {
    // o userId no filtro impede mexer em item de outra pessoa
    const result = await prisma.libraryItem.updateMany({
      where: { id, userId: req.userId },
      data: parsed.data,
    });
    if (result.count === 0) {
      return res.status(404).json({ message: 'Item não encontrado.' });
    }

    const item = await prisma.libraryItem.findUnique({ where: { id } });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar o item.' });
  }
});

// DELETE /library/:id
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido.' });

  try {
    const result = await prisma.libraryItem.deleteMany({
      where: { id, userId: req.userId },
    });
    if (result.count === 0) {
      return res.status(404).json({ message: 'Item não encontrado.' });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao remover o item.' });
  }
});

module.exports = router;
