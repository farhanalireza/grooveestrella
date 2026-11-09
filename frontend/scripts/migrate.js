// scripts/migrate.js
const fs = require('fs');
const path = require('path');
const pg = require('pg');

// Manually parse .env.local to ensure all env vars are available
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvLocal();

async function runMigration() {
  const schemaPath = path.resolve(__dirname, '../../supabase/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('Schema file not found at:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log(`Loaded schema file (${sql.length} bytes).`);

  const projectId = process.env.SUPABASE_PROJECT_ID || 'dgdfjpvvlnwpnegssjeh';
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const dbPassword = process.env.DATABASE_PASSWORD || process.env.SUPABASE_DB_PASSWORD;
  const databaseUrl = process.env.DATABASE_URL;

  console.log(`Target Supabase Project ID: ${projectId}`);

  // Candidate connection strings to try
  const candidateURIs = [];

  if (databaseUrl) {
    candidateURIs.push({ name: 'Configured DATABASE_URL', uri: databaseUrl });
  }

  if (dbPassword) {
    const encodedPass = encodeURIComponent(dbPassword);
    
    // Direct host (port 5432)
    candidateURIs.push({
      name: `Direct db.${projectId}.supabase.co:5432`,
      uri: `postgresql://postgres:${encodedPass}@db.${projectId}.supabase.co:5432/postgres`
    });

    // Supabase Pooler hosts (port 6543 and 5432) across regions
    const regions = [
      'ap-south-1', // Mumbai (very common for Indian subcontinent)
      'us-east-1',  // N. Virginia
      'us-west-1',  // N. California
      'eu-west-1',  // Ireland
      'eu-central-1', // Frankfurt
      'ap-southeast-1', // Singapore
    ];

    for (const reg of regions) {
      candidateURIs.push({
        name: `Pooler Transaction mode (${reg}:6543)`,
        uri: `postgresql://postgres.${projectId}:${encodedPass}@aws-0-${reg}.pooler.supabase.com:6543/postgres`
      });
      candidateURIs.push({
        name: `Pooler Session mode (${reg}:5432)`,
        uri: `postgresql://postgres.${projectId}:${encodedPass}@aws-0-${reg}.pooler.supabase.com:5432/postgres`
      });
    }
  }

  let success = false;

  for (const target of candidateURIs) {
    console.log(`\nAttempting connection via: ${target.name}...`);
    const client = new pg.Client({
      connectionString: target.uri,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      console.log(`Connected to database via ${target.name}! Executing schema migration...`);
      await client.query(sql);
      console.log('Schema migration completed successfully! 🎉');
      await client.end();
      success = true;
      break;
    } catch (err) {
      console.warn(`Connection failed for ${target.name}:`, err.message);
      await client.end().catch(() => {});
    }
  }

  if (success) {
    console.log('\n======================================================');
    console.log('SUCCESS: All 5 core tables, views, RLS policies,');
    console.log('and automatic profile triggers are now live on Supabase!');
    console.log('======================================================\n');
    process.exit(0);
  } else {
    console.error('\nCould not connect via candidate connection endpoints.');
    process.exit(1);
  }
}

runMigration().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
