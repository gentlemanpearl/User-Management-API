const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// In-memory storage
let users = [];

// Validation function
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
  return null;
}

// Routes

// GET /users - List all users
app.get('/users', (req, res) => {
  res.json(users);
});

// GET /users/:id - Get user by ID
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// POST /users - Add user
app.post('/users', (req, res) => {
  const error = validateUser(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const newUser = {
    id: uuidv4(),
    name: req.body.name.trim(),
    email: req.body.email,
    age: req.body.age || null
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// PUT /users/:id - Update user
app.put('/users/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const error = validateUser(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const updatedUser = {
    ...users[userIndex],
    name: req.body.name.trim(),
    email: req.body.email,
    age: req.body.age || users[userIndex].age
  };

  users[userIndex] = updatedUser;
  res.json(updatedUser);
});

// DELETE /users/:id - Remove user
app.delete('/users/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(userIndex, 1);
  res.json({ message: 'User deleted successfully' });
});

// Additional routes

// GET /users/search?name=... - Search users by name
app.get('/users/search', (req, res) => {
  const name = req.query.name;
  if (!name) {
    return res.status(400).json({ error: 'Name query parameter is required' });
  }

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(name.toLowerCase()));
  res.json(filteredUsers);
});

// GET /users/adults - Get users with age >= 18
app.get('/users/adults', (req, res) => {
  const adults = users.filter(u => u.age && u.age >= 18);
  res.json(adults);
});

// GET /users/emails - Get all user emails
app.get('/users/emails', (req, res) => {
  const emails = users.map(u => u.email);
  res.json(emails);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});