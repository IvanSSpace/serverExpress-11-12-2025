require('dotenv').config();
const express = require('express');
const { loggerMiddleware, authMiddleware, errorMiddleware } = require('./middleware.js');
const { pool } = require('./db.js');
const authRouter = require('./auth.js');

const app = express();

app.use(loggerMiddleware);
app.use(express.json());

app.use('/auth', authRouter);

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
    `SELECT id, email, name, created_at FROM users WHERE id = $1 LIMIT 1;`,
    [id]
  );

  res.json(data.rows[0]);
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

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});
