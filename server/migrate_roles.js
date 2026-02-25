const pool = require('./db');

async function migrateRoles() {
    const conn = await pool.getConnection();
    try {
        console.log('Starting role migration...');

        // 1. Insert "Staff" role if it doesn't exist
        await conn.query(
            `INSERT IGNORE INTO roles (name, can_access_analytics, can_access_inventory) VALUES ('Staff', TRUE, TRUE)`
        );
        console.log('✓ Staff role created');

        // 2. Find Staff role ID
        const [staffRows] = await conn.query(`SELECT id FROM roles WHERE name = 'Staff'`);
        const staffId = staffRows[0].id;

        // 3. Reassign all users with old roles to Staff
        await conn.query(
            `UPDATE users SET role_id = ? WHERE role_id IN (SELECT id FROM roles WHERE name IN ('Head Cashier', 'Cashier'))`,
            [staffId]
        );
        console.log('✓ Reassigned old role users to Staff');

        // 4. Delete old roles
        await conn.query(`DELETE FROM roles WHERE name IN ('Head Cashier', 'Cashier')`);
        console.log('✓ Deleted Head Cashier and Cashier roles');

        const [roles] = await conn.query(`SELECT * FROM roles`);
        console.log('Current roles:', roles);

        console.log('Migration complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        conn.release();
        process.exit(0);
    }
}

migrateRoles();
