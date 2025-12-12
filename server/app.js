const express = require('express');
const { loggerMiddleware } = require('./middleware.js');
const { pool } = require('./db.js');
const app = express();
const port = 3000;

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
  const data = await pool.query('SELECT * FROM users');
  res.json(data.rows);
});

app.get('/users/:id', async (req, res) => {
  const id = Number(req.params.id);

  // if (isNaN(id)) res.status(400).json({ error: 'invalid id' });

  const data = await pool.query(
    `SELECT id, email, name, created_at  FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );

  // if (user === undefined) res.status(404).json({ error: 'user not found' });

  res.json(data.rows[0]);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
