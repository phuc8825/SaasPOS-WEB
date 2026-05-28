const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function inspect() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);
    
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    
    const tableData = {};
    for (const row of res.rows) {
      if (!tableData[row.table_name]) {
        tableData[row.table_name] = { columns: [] };
      }
      tableData[row.table_name].columns.push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable
      });
    }
    
    for (const tableRow of tablesRes.rows) {
      const tableName = tableRow.table_name;
      const countRes = await pool.query(`SELECT count(*) FROM "${tableName}"`);
      if (tableData[tableName]) {
        tableData[tableName].rowCount = countRes.rows[0].count;
      }
    }

    console.log(JSON.stringify(tableData, null, 2));
  } catch (err) {
    console.error('Error connecting to DB:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

inspect();
