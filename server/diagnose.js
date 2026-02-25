const mysql = require('mysql2/promise');
require('dotenv').config();

async function diagnose() {
    console.log('--- Database Diagnosis ---');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    console.log('Password set:', !!process.env.DB_PASSWORD);

    try {
        console.log('Attempting to connect to MySQL...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: parseInt(process.env.DB_PORT) || 3308,
        });
        console.log('✅ Connection to MySQL successful!');

        const [databases] = await connection.query('SHOW DATABASES');
        console.log('Available Databases:', databases.map(d => d.Database));

        const dbExists = databases.some(d => d.Database === process.env.DB_NAME);
        if (dbExists) {
            console.log(`✅ Database "${process.env.DB_NAME}" exists.`);
            await connection.query(`USE ${process.env.DB_NAME}`);
            const [tables] = await connection.query('SHOW TABLES');
            console.log('Tables:', tables.map(t => Object.values(t)[0]));
        } else {
            console.log(`❌ Database "${process.env.DB_NAME}" NOT FOUND.`);
        }

        await connection.end();
    } catch (err) {
        console.error('❌ Diagnosis Failed:');
        console.error('Code:', err.code);
        console.error('Errno:', err.errno);
        console.error('SQLState:', err.sqlState);
        console.error('Message:', err.message);
    }
}

diagnose();
