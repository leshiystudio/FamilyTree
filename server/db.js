import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST ,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'genealogy',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
});

export default pool;
