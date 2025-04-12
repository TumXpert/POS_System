const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController'); // Adjust path as necessary
const protect = require('../middleware/auth'); // If applicable
const authorizeRoles = require('../middleware/role'); // If applicable

router.post('/', protect, authorizeRoles('admin', 'manager', 'cashier'), salesController.createSale);

module.exports = router;
