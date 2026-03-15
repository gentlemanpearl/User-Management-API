const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new sqlite3.Database('database.db');

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      age INTEGER,
      isActive BOOLEAN DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL
    )
  `);
});

// Middleware
app.use(express.json());

// Validation functions
function validateUser(user) {
  if (!user.name || typeof user.name !== 'string' || user.name.trim() === '') {
    return 'Name is required and must be a non-empty string';
  }
  if (!user.email || typeof user.email !== 'string' || !user.email.includes('@')) {
    return 'Valid email is required';
  }
  if (user.age !== undefined && (typeof user.age !== 'number' || user.age < 0)) {
    return 'Age must be a non-negative number';
  }
  if (user.isActive !== undefined && typeof user.isActive !== 'boolean') {
    return 'isActive must be a boolean';
  }
  return null;
}

function validateProduct(product) {
  if (!product.name || typeof product.name !== 'string' || product.name.trim() === '') {
    return 'Name is required and must be a non-empty string';
  }
  if (product.price === undefined || typeof product.price !== 'number' || product.price < 0) {
    return 'Price is required and must be a non-negative number';
  }
  if (!product.category || typeof product.category !== 'string' || product.category.trim() === '') {
    return 'Category is required and must be a non-empty string';
  }
  return null;
}

// Helper function to promisify database operations
function dbAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// User Routes

// GET /users - List all active users
app.get('/users', async (req, res) => {
  try {
    const users = await dbAll('SELECT * FROM users WHERE isActive = 1');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /users - Add user
app.post('/users', async (req, res) => {
  const error = validateUser(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const result = await dbRun(
      'INSERT INTO users (name, email, age, isActive) VALUES (?, ?, ?, ?)',
      [req.body.name.trim(), req.body.email, req.body.age || null, req.body.isActive !== undefined ? req.body.isActive : 1]
    );
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [result.lastID]);
    res.status(201).json(user);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

// PUT /users/:id - Update user
app.put('/users/:id', async (req, res) => {
  const error = validateUser(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const result = await dbRun(
      'UPDATE users SET name = ?, email = ?, age = ?, isActive = ? WHERE id = ?',
      [req.body.name.trim(), req.body.email, req.body.age || null, req.body.isActive !== undefined ? req.body.isActive : 1, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(user);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

// DELETE /users/:id - Remove user
app.delete('/users/:id', async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Additional user routes

// GET /users/search?name=... - Search users by name
app.get('/users/search', async (req, res) => {
  const name = req.query.name;
  if (!name) {
    return res.status(400).json({ error: 'Name query parameter is required' });
  }

  try {
    const users = await dbAll('SELECT * FROM users WHERE name LIKE ? AND isActive = 1', [`%${name}%`]);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /users/adults - Get users with age >= 18
app.get('/users/adults', async (req, res) => {
  try {
    const adults = await dbAll('SELECT * FROM users WHERE age >= 18 AND isActive = 1');
    res.json(adults);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /users/age/:min - Get users older than given age
app.get('/users/age/:min', async (req, res) => {
  const minAge = parseInt(req.params.min);
  if (isNaN(minAge) || minAge < 0) {
    return res.status(400).json({ error: 'Invalid age parameter' });
  }

  try {
    const users = await dbAll('SELECT * FROM users WHERE age > ? AND isActive = 1', [minAge]);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /users/emails - Get all user emails
app.get('/users/emails', async (req, res) => {
  try {
    const emails = await dbAll('SELECT email FROM users WHERE isActive = 1');
    res.json(emails.map(row => row.email));
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /users/:id - Get user by ID (must be last to avoid conflicts)
app.get('/users/:id', async (req, res) => {
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Product Routes

// GET /products - List all products
app.get('/products', async (req, res) => {
  try {
    const products = await dbAll('SELECT * FROM products');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /products/:id - Get product by ID
app.get('/products/:id', async (req, res) => {
  try {
    const product = await dbGet('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /products - Add product
app.post('/products', async (req, res) => {
  const error = validateProduct(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const result = await dbRun(
      'INSERT INTO products (name, price, category) VALUES (?, ?, ?)',
      [req.body.name.trim(), req.body.price, req.body.category.trim()]
    );
    const product = await dbGet('SELECT * FROM products WHERE id = ?', [result.lastID]);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT /products/:id - Update product
app.put('/products/:id', async (req, res) => {
  const error = validateProduct(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const result = await dbRun(
      'UPDATE products SET name = ?, price = ?, category = ? WHERE id = ?',
      [req.body.name.trim(), req.body.price, req.body.category.trim(), req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await dbGet('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /products/:id - Remove product
app.delete('/products/:id', async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));