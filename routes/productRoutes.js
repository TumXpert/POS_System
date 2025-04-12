const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const protect = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const upload = require('../middleware/upload');

// Admin or Manager can create, update, delete
router.post(
  '/',
  protect,
  authorizeRoles('admin', 'manager'),
  upload.single('image'),
  productController.createProduct
);

router.get('/', protect, productController.getAllProducts);

router.put(
  '/:id',
  protect,
  authorizeRoles('admin', 'manager'),
  upload.single('image'),
  productController.updateProduct
);

router.delete(
  '/:id',
  protect,
  authorizeRoles('admin', 'manager'),
  productController.deleteProduct
);
router.get('/:id', protect, productController.getProductById);


module.exports = router;
