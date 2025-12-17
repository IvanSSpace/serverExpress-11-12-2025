require('dotenv').config();
const express = require('express');
const { loggerMiddleware, authMiddleware } = require('./middleware.js');
const { pool } = require('./db.js');
const jwt = require('jsonwebtoken');
const app = express();
const bcrypt = require('bcrypt');

app.use(loggerMiddleware);
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/ping', (req, res) => {
  res.send('something on ping');
});

app.get('/users', async (req, res) => {
  const data = await pool.query('SELECT * FROM users;');
  res.json(data.rows);
});

app.get('/users/:id', async (req, res) => {
  const id = Number(req.params.id);

  const data = await pool.query(
    `SELECT id, email, name, created_at  FROM users WHERE id = $1 LIMIT 1;`,
    [id]
  );

  res.json(data.rows[0]);
});

app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const emailIsBusy = await pool.query(
    `SELECT id FROM users WHERE email = $1;
`,
    [email]
  );

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
    res.status(200).json({ message: response.rows[0] });
  });
});

app.post('/auth/login', async (req, res) => {
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
      const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

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

app.get('/me', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [
    req.user.id,
  ]);

  if (result.rows.length === 0) {
    return res.status(401).json({ message: 'user not found' });
  }

  res.json(result.rows[0]);
});

app.get('/private', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [
    req.user.id,
  ]);

  if (result.rows.length === 0) {
    return res.status(401).json({ message: 'user not found' });
  }

  res.json({ message: 'private content' });
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});
