const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function initDB() {
    console.log('--- Initializing Database ---');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: parseInt(process.env.DB_PORT) || 3306,
            multipleStatements: true,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
        });

        const dbName = process.env.DB_NAME || 'modern_ims';
        console.log(`Creating database ${dbName}...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        await connection.query(`USE ${dbName}`);

        console.log('Reading schema.sql...');
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

        console.log('Executing schema...');
        await connection.query(schema);

        console.log('✅ Database initialized successfully!');
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Initialization failed:', err);
        process.exit(1);
    }
}

initDB();
