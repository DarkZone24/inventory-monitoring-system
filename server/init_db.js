const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
    console.log('--- Initializing Database ---');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: 3307,
            multipleStatements: true
        });

        console.log('Creating database modern_ims...');
        await connection.query('CREATE DATABASE IF NOT EXISTS modern_ims');
        await connection.query('USE modern_ims');

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
