require('dotenv').config();
const express = require('express');
const { loggerMiddleware } = require('./middleware.js');
const { pool } = require('./db.js');
const app = express();
const bcrypt = require('bcrypt');

// const someOtherPlaintextPassword = 'not_bacon';

// const users = [
//   { id: 0, name: 'vlad', age: 31, sex: 'man' },
//   { id: 1, name: 'greg', age: 32, sex: 'man' },
//   { id: 2, name: 'ivan', age: 22, sex: 'man' },
//   { id: 3, name: 'sonik', age: 21, sex: 'girl' },
// ];

app.use(loggerMiddleware);
app.use(express.json()); // заранее если тело будет

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

  // if (isNaN(id)) res.status(400).json({ error: 'invalid id' });

  const data = await pool.query(
    `SELECT id, email, name, created_at  FROM users WHERE id = $1 LIMIT 1;`,
    [id]
  );

  // if (user === undefined) res.status(404).json({ error: 'user not found' });

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

  const salt = await bcrypt.genSalt(10);

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

// app.post('/login', async (req, res) => {
//   // 1 клиент присылает email password а сервер ищет пользователя по email
//   // 2 сравниваем пароль с password_hash
//   // 3 если совпало → создаём JWT
// });

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});
