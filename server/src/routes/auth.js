const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../lib/prisma');

const router = express.Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'O nome precisa ter ao menos 2 letras.'),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres.'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

function createToken(user) {
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /auth/register
router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { name, email, password } = parsed.data;

  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: 'Esse e-mail já está cadastrado.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password: hash } });

    res.status(201).json({
      token: createToken(user),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar a conta.' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const ok = user && (await bcrypt.compare(password, user.password));

    if (!ok) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    res.json({
      token: createToken(user),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao fazer login.' });
  }
});

module.exports = router;