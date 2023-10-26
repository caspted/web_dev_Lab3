import { Pool } from 'pg'

const config = {
  user: 'postgres',
  host: 'localhost',
  database: 'vet_clinic',
  password: 'your_password',
  port: 5432
}

const pool = new Pool(config)

export default pool;