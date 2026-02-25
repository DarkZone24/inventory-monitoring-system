const pool = require('./db');
require('dotenv').config();

async function check() {
    try {
        const [users] = await pool.query(`
            SELECT u.email, r.name as role 
            FROM users u 
            JOIN roles r ON u.role_id = r.id
        `);
        console.log('--- USERS ---');
        users.forEach(u => console.log(`${u.email} (${u.role})`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
