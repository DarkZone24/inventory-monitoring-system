const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Security Middleware
app.use(helmet());

// Hardened CORS configuration
const allowedOrigins = [
    'http://localhost:5173', // Vite Default
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests) 
        // but for a web app, we usually want to restrict this.
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate Limiting for Login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { error: 'Too many login attempts, please try again later' }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// RBAC Middleware
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Permission denied. Unauthorized role.' });
        }
        next();
    };
};

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Basic health check
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS result');
        res.json({
            status: 'Server is running',
            database: 'Connected',
            db_test: rows[0].result === 2 ? 'OK' : 'Failed'
        });
    } catch (err) {
        res.status(500).json({
            status: 'Server is running',
            database: 'Error',
            error: err.message
        });
    }
});

// Login Route
app.post('/api/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.query(`
            SELECT u.*, r.name as role 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.email = ?
        `, [email]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT
        const { rememberMe } = req.body;
        const expiresIn = rememberMe ? '7d' : '8h';

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Users Routes (Protected - Admin Only)
app.get('/api/users', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.name, u.email, u.status, r.name as role 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id
        `);
        res.json(rows);
    } catch (err) {
        console.error('API Error (/api/inventory):', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/roles', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM roles');
        res.json(rows);
    } catch (err) {
        console.error('API Error (/api/inventory):', err);
        res.status(500).json({ error: err.message });
    }
});

// Update Role Permissions
app.post('/api/roles/update-permissions', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    const { roleName, analytics, inventory } = req.body;
    try {
        await pool.query(
            'UPDATE roles SET can_access_analytics = ?, can_access_inventory = ? WHERE name = ?',
            [analytics, inventory, roleName]
        );
        res.json({ message: 'Permissions updated successfully' });
    } catch (err) {
        console.error('API Error (/api/inventory):', err);
        res.status(500).json({ error: err.message });
    }
});

// Create User
app.post('/api/users', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    const { name, email, role, password } = req.body;
    try {
        // Find role_id
        const [roles] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
        if (roles.length === 0) return res.status(400).json({ error: 'Role not found' });
        const role_id = roles[0].id;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO users (name, email, password_hash, role_id, status) VALUES (?, ?, ?, ?, ?)',
            [name, email, password_hash, role_id, 'Active']
        );
        res.json({ message: 'User created successfully' });
    } catch (err) {
        console.error('API Error (/api/users POST):', err);
        res.status(500).json({ error: err.message });
    }
});

// Update User
app.put('/api/users/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    const { id } = req.params;
    const { name, email, role, status } = req.body;
    try {
        const [roles] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
        if (roles.length === 0) return res.status(400).json({ error: 'Role not found' });
        const role_id = roles[0].id;

        await pool.query(
            'UPDATE users SET name = ?, email = ?, role_id = ?, status = ? WHERE id = ?',
            [name, email, role_id, status, id]
        );
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('API Error (/api/users PUT):', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete User
app.delete('/api/users/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('API Error (/api/users DELETE):', err);
        res.status(500).json({ error: err.message });
    }
});

// Inventory Routes
app.get('/api/inventory', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.id, p.name, p.stock_qty, p.price, p.status, c.name as category 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
        `);
        res.json(rows);
    } catch (err) {
        console.error('API Error (/api/inventory):', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/inventory', authenticateToken, authorizeRoles('Admin', 'Staff'), async (req, res) => {
    let { name, category_id, price, stock_qty } = req.body;
    if (price === undefined || price === null || price === '') price = 0;
    try {
        // Simple status calculation
        let status = 'Optimal';
        if (parseInt(stock_qty) === 0) status = 'Out of Stock';
        else if (parseInt(stock_qty) < 10) status = 'Low Stock';

        await pool.query(
            'INSERT INTO products (name, category_id, price, stock_qty, status) VALUES (?, ?, ?, ?, ?)',
            [name, category_id, price, stock_qty, status]
        );
        res.json({ message: 'Product added successfully' });
    } catch (err) {
        console.error('API Error (/api/inventory POST):', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/inventory/:id', authenticateToken, authorizeRoles('Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    let { name, category_id, price, stock_qty } = req.body;
    if (price === undefined || price === null || price === '') price = 0;
    try {
        // Recalculate status
        let status = 'Optimal';
        if (parseInt(stock_qty) === 0) status = 'Out of Stock';
        else if (parseInt(stock_qty) < 10) status = 'Low Stock';

        await pool.query(
            'UPDATE products SET name = ?, category_id = ?, price = ?, stock_qty = ?, status = ? WHERE id = ?',
            [name, category_id, price, stock_qty, status, id]
        );
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        console.error('API Error (/api/inventory PUT):', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/inventory/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('API Error (/api/inventory DELETE):', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories');
        res.json(rows);
    } catch (err) {
        console.error('API Error (/api/inventory):', err);
        res.status(500).json({ error: err.message });
    }
});

// Analytics Routes
app.get('/api/analytics/sales-report', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        // Mocking sales trend for the last 7 days since we might not have much data
        const [rows] = await pool.query(`
            SELECT DATE(sale_date) as date, SUM(total_price) as revenue, SUM(quantity) as count
            FROM sales 
            GROUP BY DATE(sale_date) 
            ORDER BY date DESC LIMIT 7
        `);
        res.json(rows);
    } catch (err) {
        console.error('API Error (/api/inventory):', err);
        res.status(500).json({ error: err.message });
    }
});

// Borrowing Routes
app.get('/api/borrowings', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT b.*, p.name as product_name 
            FROM borrowings b 
            JOIN products p ON b.product_id = p.id 
            ORDER BY b.borrow_date DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('API Error (/api/borrowings):', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/borrowings', authenticateToken, async (req, res) => {
    const { product_id, borrower_name, quantity } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Check stock
        const [products] = await conn.query('SELECT stock_qty FROM products WHERE id = ?', [product_id]);
        if (products.length === 0) throw new Error('Product not found');

        const currentStock = products[0].stock_qty;
        if (currentStock < parseInt(quantity)) throw new Error('Insufficient stock');

        // 2. Log borrowing
        await conn.query(
            'INSERT INTO borrowings (product_id, borrower_name, quantity, status) VALUES (?, ?, ?, ?)',
            [product_id, borrower_name, quantity, 'Borrowed']
        );

        // 3. Update stock & status
        const newStock = currentStock - parseInt(quantity);
        let status = 'Optimal';
        if (newStock === 0) status = 'Out of Stock';
        else if (newStock < 10) status = 'Low Stock';

        await conn.query(
            'UPDATE products SET stock_qty = ?, status = ? WHERE id = ?',
            [newStock, status, product_id]
        );

        await conn.commit();
        res.json({ message: 'Borrowing recorded successfully' });
    } catch (err) {
        await conn.rollback();
        console.error('API Error (/api/borrowings POST):', err);
        res.status(500).json({ error: err.message || 'Server error' });
    } finally {
        conn.release();
    }
});

app.put('/api/borrowings/:id/return', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Get borrowing info
        const [borrowings] = await conn.query('SELECT * FROM borrowings WHERE id = ?', [id]);
        if (borrowings.length === 0) throw new Error('Borrowing record not found');
        if (borrowings[0].status === 'Returned') throw new Error('Item already returned');

        const { product_id, quantity } = borrowings[0];

        // 2. Mark as returned
        await conn.query(
            'UPDATE borrowings SET status = "Returned", return_date = NOW() WHERE id = ?',
            [id]
        );

        // 3. Update stock
        const [products] = await conn.query('SELECT stock_qty FROM products WHERE id = ?', [product_id]);
        const newStock = products[0].stock_qty + quantity;

        let status = 'Optimal';
        if (newStock === 0) status = 'Out of Stock';
        else if (newStock < 10) status = 'Low Stock';

        await conn.query(
            'UPDATE products SET stock_qty = ?, status = ? WHERE id = ?',
            [newStock, status, product_id]
        );

        await conn.commit();
        res.json({ message: 'Item returned successfully' });
    } catch (err) {
        await conn.rollback();
        console.error('API Error (/api/borrowings/return):', err);
        res.status(500).json({ error: err.message || 'Server error' });
    } finally {
        conn.release();
    }
});

app.get('/api/analytics/category-stats', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.name, SUM(p.stock_qty) as total_qty 
            FROM products p 
            JOIN categories c ON p.category_id = c.id 
            GROUP BY c.name
        `);
        res.json(rows);
    } catch (err) {
        console.error('API Error (/api/inventory):', err);
        res.status(500).json({ error: err.message });
    }
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const [[{ total_products }]] = await pool.query('SELECT SUM(stock_qty) as total_products FROM products');
        const [[{ active_borrowings }]] = await pool.query('SELECT COUNT(*) as active_borrowings FROM borrowings WHERE status = "Borrowed"');
        const [[{ low_stock }]] = await pool.query('SELECT COUNT(*) as low_stock FROM products WHERE stock_qty < 5 AND stock_qty > 0');
        const [[{ total_users }]] = await pool.query('SELECT COUNT(*) as total_users FROM users');
        const [[{ total_stock }]] = await pool.query('SELECT SUM(stock_qty) as total_stock FROM products');

        const [recent_activity] = await pool.query(`
            SELECT borrower_name as text, CONCAT('Borrowed ', quantity, ' ', p.name) as action, borrow_date as time, 'update' as type 
            FROM borrowings b
            JOIN products p ON b.product_id = p.id
            ORDER BY borrow_date DESC LIMIT 5
        `);

        res.json({
            total_products,
            active_borrowings,
            low_stock,
            total_users,
            total_stock,
            recent_activity
        });
    } catch (err) {
        console.error('API Error (/api/inventory):', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
