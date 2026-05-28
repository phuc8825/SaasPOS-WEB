const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../config/db');

async function runSchema() {
  try {
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⏳ Running schema.sql on AWS RDS...');
    await pool.query(schemaSql);
    console.log('✅ Schema executed successfully!');
    
    // Check if tables exist
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📊 Tables in database:', tablesRes.rows.map(r => r.table_name).join(', '));

  } catch (err) {
    console.error('❌ Error executing schema:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSchema();
