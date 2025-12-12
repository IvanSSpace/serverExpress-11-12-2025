import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'shar',
  host: 'localhost',
  database: 'serverexpress11122025',
  password: '',
  port: 5432,
});

export { pool };
