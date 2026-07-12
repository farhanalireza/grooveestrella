// src/lib/db.js
import mysql from 'mysql2/promise';
import pg from 'pg';

let pool;
let isPostgres = false;

export function getDatabasePool() {
  if (pool) return pool;

  let uri = process.env.DATABASE_URI || process.env.DATABASE_URL;

  if (!uri) {
    throw new Error('DATABASE_URI or DATABASE_URL environment variable is not defined.');
  }

  isPostgres = uri.startsWith('postgres://') || uri.startsWith('postgresql://');

  try {
    if (isPostgres) {
      console.log('Connecting to PostgreSQL database (Supabase)...');
      pool = new pg.Pool({
        connectionString: uri,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      return pool;
    } else {
      console.log('Connecting to MySQL database...');
      // Convert Python SQLAlchemy mysql+pymysql:// format to standard mysql://
      if (uri.startsWith('mysql+pymysql://')) {
        uri = uri.replace('mysql+pymysql://', 'mysql://');
      }
      pool = mysql.createPool({
        uri: uri,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });
      return pool;
    }
  } catch (error) {
    console.error(`Failed to create database pool (${isPostgres ? 'Postgres' : 'MySQL'}):`, error);
    throw error;
  }
}

export async function query(sql, params = []) {
  const dbPool = getDatabasePool();

  if (isPostgres) {
    // Translate standard "?" parameter placeholders to PostgreSQL "$1", "$2", etc.
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    
    const client = await dbPool.connect();
    try {
      const res = await client.query(pgSql, params);
      return res.rows;
    } finally {
      client.release();
    }
  } else {
    const [results] = await dbPool.execute(sql, params);
    return results;
  }
}
