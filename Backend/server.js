const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();

// --- CORS CONFIGURATION ---
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json());

const server = http.createServer(app);

// --- SOCKET.IO CORS ---
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// --- FILE STORAGE HANDLING FOR USER.JSON / USERS.JSON ---
const getUserFilePath = () => {
  const userJsonPath = path.join(__dirname, 'user.json');
  const usersJsonPath = path.join(__dirname, 'users.json');
  if (fs.existsSync(userJsonPath)) return userJsonPath;
  if (fs.existsSync(usersJsonPath)) return usersJsonPath;
  return userJsonPath;
};

const loadUsers = () => {
  try {
    const filePath = getUserFilePath();
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      const parsedData = JSON.parse(fileData);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        return parsedData.map(u => ({
          ...u,
          _id: (u._id || u.id).toString(),
          id: (u.id || u._id).toString()
        }));
      }
    }
  } catch (err) {
    console.error("Error reading user file:", err.message);
  }

  return [
    { _id: '1', id: '1', name: 'Super Admin', email: 'admin@foodieyou.com', password: 'admin123', role: 'admin', status: 'approved' },
    { _id: '2', id: '2', name: 'Chef Suresh', email: 'staff@foodieyou.com', password: 'password123', role: 'staff', status: 'approved' }
  ];
};

const saveUsers = (data) => {
  try {
    const filePath = getUserFilePath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error saving user file:", err.message);
  }
};

let users = loadUsers();

let orders = [
  { tokenNumber: 101, studentName: 'Student User', items: [{ name: 'Veg Burger', price: 50, qty: 1 }], total: 50, status: 'completed', createdAt: new Date() }
];

let menu = [
  { _id: 'm1', name: 'Veg Burger', price: 50, category: 'Fast Food', stock: 25, left: 25, quantity: 25, inStock: true, available: true },
  { _id: 'm2', name: 'Cheese Pizza', price: 120, category: 'Fast Food', stock: 15, left: 15, quantity: 15, inStock: true, available: true },
  { _id: 'm3', name: 'French Fries', price: 60, category: 'Fast Food', stock: 30, left: 30, quantity: 30, inStock: true, available: true },
  { _id: 'm4', name: 'Masala Dosa', price: 80, category: 'South Indian', stock: 20, left: 20, quantity: 20, inStock: true, available: true },
  { _id: 'm5', name: 'Cold Coffee', price: 40, category: 'Beverages', stock: 40, left: 40, quantity: 40, inStock: true, available: true },
  { _id: 'm6', name: 'Veg Noodles', price: 70, category: 'Chinese', stock: 20, left: 20, quantity: 20, inStock: true, available: true },
  { _id: 'm7', name: 'Paneer Roll', price: 70, category: 'Snacks', stock: 20, left: 20, quantity: 20, inStock: true, available: true }
];

io.on('connection', (socket) => {
  console.log(`⚡ Connected Client: ${socket.id}`);
});

// --- API ROUTES ---

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  
  if (!user) {
    return res.status(400).json({ error: 'Account not found or incorrect password!' });
  }

  if (user.status !== 'approved' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Your account is pending admin approval.' });
  }

  res.json(user);
});

app.post('/api/users/register', (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email already registered!' });
  }
  
  const newId = Date.now().toString();
  const newUser = {
    _id: newId,
    id: newId,
    name,
    email,
    password,
    role: role || 'student',
    status: 'pending'
  };
  
  users.push(newUser);
  saveUsers(users);
  io.emit('user_registered', newUser);
  res.status(201).json(newUser);
});

app.put('/api/users/:id/approve', (req, res) => {
  const targetId = req.params.id.toString();
  const user = users.find(u => (u._id || u.id).toString() === targetId);
  
  if (user) {
    user.status = 'approved';
    saveUsers(users);
    io.emit('user_status_updated', user);
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const targetId = req.params.id.toString();
  users = users.filter(u => (u._id || u.id).toString() !== targetId);
  saveUsers(users);
  io.emit('user_deleted', req.params.id);
  res.json({ message: 'User deleted' });
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const tokenNumber = Math.floor(1000 + Math.random() * 9000);
  const newOrder = { 
    ...req.body, 
    tokenNumber, 
    status: 'pending',
    createdAt: new Date()
  };
  orders.push(newOrder);
  io.emit('new_order', newOrder);
  res.status(201).json(newOrder);
});

app.post('/api/payment', (req, res) => {
  res.json({ success: true, paymentId: 'PAY_' + Date.now(), message: 'Payment verified' });
});

app.post('/api/pay', (req, res) => {
  res.json({ success: true, paymentId: 'PAY_' + Date.now(), message: 'Payment processed' });
});

app.put('/api/orders/:tokenNumber', (req, res) => {
  const order = orders.find(o => o.tokenNumber.toString() === req.params.tokenNumber);
  if (order) {
    order.status = req.body.status;
    io.emit('order_status_updated', order);
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

app.get('/api/menu', (req, res) => {
  res.json(menu);
});

app.post('/api/menu', (req, res) => {
  const val = req.body.stock || req.body.left || 25;
  const newItem = { 
    _id: Date.now().toString(), 
    stock: val, 
    left: val, 
    quantity: val, 
    inStock: true, 
    available: true, 
    ...req.body 
  };
  menu.push(newItem);
  io.emit('menu_updated', menu);
  res.status(201).json(newItem);
});

app.delete('/api/menu/:id', (req, res) => {
  menu = menu.filter(m => m._id !== req.params.id);
  io.emit('menu_updated', menu);
  res.json({ message: 'Menu item removed' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});