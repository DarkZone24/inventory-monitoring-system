const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    console.log('--- Seeding Initial Admin User ---');
    try {
        // Check if Admin role exists
        const [roles] = await pool.query('SELECT id FROM roles WHERE name = "Admin"');
        if (roles.length === 0) {
            console.log('Creating Admin role...');
            await pool.query('INSERT INTO roles (name, can_access_analytics, can_access_inventory) VALUES ("Admin", TRUE, TRUE)');
        }

        // Check if admin user exists
        const [users] = await pool.query('SELECT id FROM users WHERE email = "admin@tcsnhs.edu.ph"');
        if (users.length === 0) {
            console.log('Creating Admin user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPw = await bcrypt.hash('admin123', salt);

            const [adminRole] = await pool.query('SELECT id FROM roles WHERE name = "Admin"');
            await pool.query(
                'INSERT INTO users (name, email, password_hash, role_id, status) VALUES (?, ?, ?, ?, ?)',
                ['System Admin', 'admin@tcsnhs.edu.ph', hashedPw, adminRole[0].id, 'Active']
            );
            console.log('✅ Admin user created: admin@tcsnhs.edu.ph / admin123');
        } else {
            console.log('Admin user already exists.');
        }

        console.log('Seeding completed.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedAdmin();
