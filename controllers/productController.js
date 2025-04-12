const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// CREATE a product
exports.createProduct = async (req, res) => {
  try {
    const { name, barcode, price, stock, category_id } = req.body;
    const image = req.file ? req.file.filename : null;

    // Check if category exists
    const [category] = await db.execute('SELECT * FROM categories WHERE id = ?', [category_id]);
    if (category.length === 0) {
      return res.status(400).json({ message: 'Invalid category_id' });
    }

    const [result] = await db.execute(
      'INSERT INTO products (name, barcode, price, stock, category_id, image, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [name, barcode, price, stock, category_id, image]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: { id: result.insertId, name, barcode, price, stock, category_id, image }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// READ all products or search by exact name or barcode
exports.getAllProducts = async (req, res) => {
  const { name, barcode, category_id, sortBy, order } = req.query;

  try {
    let query = 'SELECT * FROM products';
    const conditions = [];
    const values = [];

    if (name) {
      conditions.push('name = ?');
      values.push(name);
    }

    if (barcode) {
      conditions.push('barcode = ?');
      values.push(barcode);
    }

    if (category_id) {
      conditions.push('category_id = ?');
      values.push(category_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    if (sortBy === 'price' || sortBy === 'stock') {
      const sortOrder = order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
    }

    const [products] = await db.execute(query, values);

    if (products.length === 0) {
      return res.status(404).json({ message: 'No entry found' });
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// UPDATE a product (with optional image replacement)
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, barcode, price, stock, category_id } = req.body;
  const newImage = req.file ? req.file.filename : null;

  try {
    // Check if category exists
    const [category] = await db.execute('SELECT * FROM categories WHERE id = ?', [category_id]);
    if (category.length === 0) {
      return res.status(400).json({ message: 'Invalid category_id' });
    }

    // Get current image
    const [existing] = await db.execute('SELECT image FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const oldImage = existing[0].image;

    // Delete old image if new one is uploaded
    if (newImage && oldImage) {
      const oldImagePath = path.join(__dirname, '..', 'uploads', oldImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    const query = newImage
      ? 'UPDATE products SET name = ?, barcode = ?, price = ?, stock = ?, category_id = ?, image = ? WHERE id = ?'
      : 'UPDATE products SET name = ?, barcode = ?, price = ?, stock = ?, category_id = ? WHERE id = ?';

    const values = newImage
      ? [name, barcode, price, stock, category_id, newImage, id]
      : [name, barcode, price, stock, category_id, id];

    await db.execute(query, values);

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// DELETE a product (and remove its image if present)
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const [product] = await db.execute('SELECT image FROM products WHERE id = ?', [id]);
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const image = product[0].image;

    await db.execute('DELETE FROM products WHERE id = ?', [id]);

    if (image) {
      const imagePath = path.join(__dirname, '..', 'uploads', image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: 'Product and image deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET a single product by ID
exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const [product] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);

    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
