const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const protect = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const productController = require('../controllers/productController');

// Routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/me', protect, userController.getMe);
router.post('/', protect, authorizeRoles('admin', 'manager'), productController.createProduct);

// Password Change
router.put('/change-password', protect, authorizeRoles('admin', 'cashier'), userController.changePassword);

module.exports = router;
