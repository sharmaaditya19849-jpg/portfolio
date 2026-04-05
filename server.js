const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API ROUTES ---

// Get all categories
app.get('/api/categories', (req, res) => {
    db.all("SELECT * FROM categories", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get products (optionally filtered by category)
app.get('/api/products', (req, res) => {
    const { category } = req.query;
    let query = "SELECT * FROM products";
    let params = [];

    if (category && category !== 'all') {
        query += " WHERE category_id = ?";
        params.push(category);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create an order (checkout)
app.post('/api/orders', (req, res) => {
    const { cart, total } = req.body;
    
    if (!cart || !cart.length) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    db.serialize(() => {
        db.run(`INSERT INTO orders (total, date) VALUES (?, datetime('now'))`, [total], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const orderId = this.lastID;
            const stmt = db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`);
            
            cart.forEach(item => {
                stmt.run(orderId, item.id, item.quantity, item.price);
            });
            stmt.finalize();

            res.status(201).json({ message: 'Order created successfully', orderId });
        });
    });
});

// Fallback route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
