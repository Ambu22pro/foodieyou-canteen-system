const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// --- IN-MEMORY MOCK DATABASE ---
let users = [
  { _id: '1', name: 'Student User', email: 'student@jiet.ac.in', password: '123', role: 'student', status: 'approved' },
  { _id: '2', name: 'Canteen Staff', email: 'staff@jiet.ac.in', password: '123', role: 'staff', status: 'approved' },
  { _id: '3', name: 'Rahul Sharma', email: 'rahul@jiet.ac.in', password: '123', role: 'student', status: 'pending' },
  { _id: '4', name: 'Priya Soni', email: 'priya@jiet.ac.in', password: '123', role: 'student', status: 'pending' }
];

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

// --- Socket.io Connection ---
io.on('connection', (socket) => {
  console.log(`⚡ Enterprise Connected: ${socket.id}`);
});

// --- API ROUTES ---

// 1. Users & Auth Routes
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
  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered!' });
  }
  const newUser = {
    _id: Date.now().toString(),
    name,
    email,
    password,
    role: role || 'student',
    status: 'pending'
  };
  users.push(newUser);
  io.emit('user_registered', newUser);
  res.status(201).json(newUser);
});

app.put('/api/users/:id/approve', (req, res) => {
  const user = users.find(u => u._id === req.params.id);
  if (user) {
    user.status = 'approved';
    io.emit('user_status_updated', user);
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  users = users.filter(u => u._id !== req.params.id);
  io.emit('user_deleted', req.params.id);
  res.json({ message: 'User deleted' });
});

// 2. Orders & Payment Routes
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
  res.json({ success: true, paymentId: 'PAY_' + Date.now(), message: 'Payment gateway verified successfully' });
});

app.post('/api/pay', (req, res) => {
  res.json({ success: true, paymentId: 'PAY_' + Date.now(), message: 'Payment processed successfully' });
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

// 3. Menu Routes
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

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 FoodieYou In-Memory Enterprise Server running on port ${PORT}`);
});