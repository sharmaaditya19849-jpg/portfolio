const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'grocery.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDB();
    }
});

function initializeDB() {
    db.serialize(() => {
        // Categories Table
        db.run(`CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT,
            icon TEXT,
            itemCount INTEGER
        )`);

        // Products Table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            category_id TEXT,
            price REAL,
            oldPrice REAL,
            image TEXT,
            badge TEXT,
            rating REAL,
            reviews INTEGER,
            FOREIGN KEY (category_id) REFERENCES categories (id)
        )`);

        // Orders Table
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total REAL,
            date TEXT
        )`);

        // Order Items Table
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            price REAL,
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`);

        seedData();
    });
}

function seedData() {
    db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
        if (row && row.count === 0) {
            console.log("Seeding categories...");
            const stmt = db.prepare("INSERT INTO categories (id, name, icon, itemCount) VALUES (?, ?, ?, ?)");
            const categories = [
                ['fruits', 'Fresh Fruits', 'fa-apple-whole', 120],
                ['vegetables', 'Vegetables', 'fa-carrot', 90],
                ['dairy', 'Dairy & Eggs', 'fa-cheese', 45],
                ['meat', 'Meat & Poultry', 'fa-drumstick-bite', 60],
                ['bakery', 'Bakery', 'fa-bread-slice', 30],
                ['beverages', 'Beverages', 'fa-wine-bottle', 150]
            ];
            categories.forEach(c => stmt.run(c));
            stmt.finalize();
        }
    });

    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (row && row.count === 0) {
            console.log("Seeding products...");
            const stmt = db.prepare(`INSERT INTO products (name, category_id, price, oldPrice, image, badge, rating, reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            const products = [
                ["Fresh Organic Apple", "fruits", 2.99, 3.99, "assets/apple.png", "Sale", 4.8, 124],
                ["Organic Bananas", "fruits", 1.99, null, "assets/banana.png", null, 4.5, 89],
                ["Farm Fresh Milk", "dairy", 4.49, null, "assets/milk.png", "New", 4.9, 210],
                ["Sourdough Bread", "bakery", 5.99, null, "assets/bread.png", null, 4.7, 156]
            ];
            products.forEach(p => stmt.run(p));
            stmt.finalize();
        }
    });
}

module.exports = db;
