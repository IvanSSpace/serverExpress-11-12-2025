const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('./db.js');
const { authMiddleware } = require('./middleware.js');

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  const emailIsBusy = await pool.query(`SELECT id FROM users WHERE email = $1;`, [email]);

  if (emailIsBusy.rowCount) {
    return res.status(400).json({ error: 'email is busy' });
  }

  bcrypt.hash(password + process.env.PEPPER_SECRET, 10, async (err, password_hash) => {
    const response = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at;`,
      [name, email, password_hash]
    );

    const user = response.rows[0];
    const token = generateToken(user);

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    `SELECT id, name, email, password_hash
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (!result.rows.length) {
    return res.status(401).json({ message: 'incorrect login' });
  }

  const user = result.rows[0];

  bcrypt.compare(password + process.env.PEPPER_SECRET, user.password_hash, (err, result) => {
    if (result) {
      const token = generateToken(user);

      res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } else {
      res.status(401).json({ message: 'incorrect password' });
    }
  });
});

// Получить текущего пользователя
router.get('/me', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [
    req.user.id,
  ]);

  if (result.rows.length === 0) {
    return res.status(401).json({ message: 'user not found' });
  }

  res.json(result.rows[0]);
});

module.exports = router;
