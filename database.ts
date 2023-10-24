import { Pool } from 'pg'
import myPassword from './password';

const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  port: 5432,
  password: myPassword,
  database: 'vet-clinic'
}

const pool = new Pool(dbConfig)

export default pool;