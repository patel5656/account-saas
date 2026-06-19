const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

const authRoutes = require('./routes/authRoutes.js');
const companyRoutes = require('./routes/companyRoutes.js');
const planRoutes = require('./routes/planRoutes.js');
const productRoutes = require('./routes/productRoutes.js');
const customerRoutes = require('./routes/customerRoutes.js');
const invoiceRoutes = require('./routes/invoiceRoutes.js');
const auditRoutes = require('./routes/auditRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes.js');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

module.exports = app;
