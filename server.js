const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const errorHandler = require('./middleware/errorHandler');
const salesRoutes = require('./routes/salesRoutes');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/api/test-db', async (req, res) => {
    const db = require('./config/db');
  
    try {
      const [rows] = await db.execute('SELECT 1 + 1 AS result');
      res.json({ success: true, message: 'Database connected!', result: rows[0].result });
    } catch (err) {
      console.error('❌ DB Connection Failed:', err);
      res.status(500).json({ success: false, message: 'Database connection failed', error: err.message });
    }
  });
  

// Error Handler
app.use(errorHandler);

// Start Server
app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});