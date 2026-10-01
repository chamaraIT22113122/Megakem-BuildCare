const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_megakem_2026';

// --- AUTH MIDDLEWARES ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
};

const requireSuperadmin = (req, res, next) => {
  if (req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Superadmin privileges required.' });
  }
  next();
};

// --- SCHEMAS ---

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['SUPERADMIN', 'VIEWER'], default: 'VIEWER' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Mail Settings Schema
const mailSettingsSchema = new mongoose.Schema({
  enableMailSending: { type: Boolean, default: true },
  ccEmails: { type: String, default: 'hr@megakemglobal.com, manager@megakemglobal.com' },
  mailFormatHtml: { type: String, default: '<h2>Employee Order Approval Request</h2><p>Dear {managerName},</p><p>An order has been submitted by <b>{employeeName}</b> ({company} - {department}) under the Megakem BuildCare employee benefit program.</p><h3>Order Details</h3>{itemsHtml}<br/><p>Please log in to the HR Admin Dashboard to review and approve this order.</p><p>Best regards,<br/>Megakem BuildCare System</p>' }
});
const MailSettings = mongoose.models.MailSettings || mongoose.model('MailSettings', mailSettingsSchema);

// Product Schema (Matching the Loyalty App)
const productSchema = new mongoose.Schema({
  name: String,
  productNo: String,
  description: String,
  imageUrl: String,
  tdsUrl: String,
  buyUrl: String,
  showInCatalog: Boolean,
  category: String,
  price: Number,
  packSizePricing: [{
    packSize: String,
    price: Number
  }],
  pointsPerProduct: Number,
  pointsPerPackSize: [{
    packSize: String,
    points: Number
  }],
  isActive: Boolean,
  isLoyaltyEnabled: Boolean,
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// API Endpoint to fetch products for the main app
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, showInCatalog: true });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

// Admin API Endpoints for Product CRUD
app.get('/api/admin/products', authenticateToken, async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching all products:', error);
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

app.post('/api/products', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Server error creating product' });
  }
});

app.put('/api/products/:id', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Server error updating product' });
  }
});

app.delete('/api/products/:id', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Server error deleting product' });
  }
});

// Order Schema for Phase 2
const orderSchema = new mongoose.Schema({
  employeeName: String,
  employeeId: String,
  company: String,
  department: String,
  managerName: String,
  items: [{
    productId: String,
    name: String,
    quantity: Number,
    packSize: String,
    color: String,
    unitPrice: Number,
    totalPrice: Number
  }],
  totalAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

const nodemailer = require('nodemailer');

// Set up Nodemailer Transporter
let transporter;
nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error('Failed to create a testing account. ' + err.message);
    return;
  }
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });
  console.log('Nodemailer test transporter ready.');
});

// API Endpoint to submit a new order
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    
    // Generate Email Body
    let itemsHtml = `
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th>Product</th><th>Pack Size</th><th>Qty</th><th>Unit Price</th><th>Total Price</th>
          </tr>
        </thead>
        <tbody>
    `;
    newOrder.items.forEach(item => {
      itemsHtml += `
        <tr>
          <td>${item.name}</td>
          <td>${item.packSize} ${item.color && item.color !== 'Default' ? `(${item.color})` : ''}</td>
          <td align="center">${item.quantity}</td>
          <td align="right">Rs. ${item.unitPrice.toFixed(2)}</td>
          <td align="right">Rs. ${item.totalPrice.toFixed(2)}</td>
        </tr>
      `;
    });
    itemsHtml += `
          <tr>
            <td colspan="4" align="right"><b>Final Order Total</b></td>
            <td align="right"><b>Rs. ${newOrder.totalAmount.toFixed(2)}</b></td>
          </tr>
        </tbody>
      </table>
    `;

    const settings = await MailSettings.findOne() || new MailSettings();
    let emailPreviewUrl = '';

    if (settings.enableMailSending && transporter) {
      let htmlBody = settings.mailFormatHtml
        .replace('{managerName}', newOrder.managerName || 'Manager')
        .replace('{employeeName}', newOrder.employeeName)
        .replace('{company}', newOrder.company)
        .replace('{department}', newOrder.department)
        .replace('{itemsHtml}', itemsHtml);

      // Wrap in a div just to be safe
      htmlBody = `<div style="font-family: Arial, sans-serif; color: #333;">${htmlBody}</div>`;

      const mailOptions = {
        from: '"Megakem BuildCare" <system@megakemglobal.com>',
        to: 'hr@megakemglobal.com, manager@megakemglobal.com',
        subject: `Order Approval Required - ${newOrder.employeeName}`,
        html: htmlBody,
      };

      if (settings.ccEmails && settings.ccEmails.trim() !== '') {
        mailOptions.cc = settings.ccEmails;
      }

      const info = await transporter.sendMail(mailOptions);
      emailPreviewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Preview URL: %s', emailPreviewUrl);
    }

    res.status(201).json({ order: newOrder, emailPreviewUrl });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Server error creating order' });
  }
});

// API Endpoint to fetch all orders (for HR Admin Dashboard)
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

// API Endpoint to update order status (Approve/Reject)
app.put('/api/orders/:id/status', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Server error updating order' });
  }
});

// API Endpoint for full order update
app.put('/api/orders/:id', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Server error updating order' });
  }
});

// API Endpoint to delete an order
app.delete('/api/orders/:id', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Server error deleting order' });
  }
});

// --- AUTHENTICATION & USER MANAGEMENT ENDPOINTS ---

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/users', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/users', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role });
    await user.save();
    
    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (err) {
    res.status(500).json({ error: 'Server error creating user' });
  }
});

app.put('/api/admin/users/:id', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const updateData = { username, role };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating user' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// --- MAIL SETTINGS ENDPOINTS ---

app.get('/api/admin/settings/mail', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    let settings = await MailSettings.findOne();
    if (!settings) {
      settings = new MailSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching settings' });
  }
});

app.put('/api/admin/settings/mail', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    let settings = await MailSettings.findOne();
    if (!settings) settings = new MailSettings();
    
    settings.enableMailSending = req.body.enableMailSending !== undefined ? req.body.enableMailSending : settings.enableMailSending;
    settings.ccEmails = req.body.ccEmails !== undefined ? req.body.ccEmails : settings.ccEmails;
    settings.mailFormatHtml = req.body.mailFormatHtml !== undefined ? req.body.mailFormatHtml : settings.mailFormatHtml;
    
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating settings' });
  }
});


const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Seed Superadmin if none exists
    const superadminExists = await User.findOne({ username: 'admin' });
    if (!superadminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({ username: 'admin', password: hashedPassword, role: 'SUPERADMIN' });
      console.log('Default superadmin created: admin / admin123');
    }
  } catch (err) {
    console.error('Error during superadmin seed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('MongoDB connection error:', err);
});
