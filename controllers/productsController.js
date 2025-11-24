const pool = require('../config/db');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    
    // Format response to match frontend structure
    const products = result.rows.map(product => ({
      id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      description: product.description,
      category: product.category,
      image: product.image,
      rating: {
        rate: parseFloat(product.rating_rate),
        count: product.rating_count
      }
    }));

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = result.rows[0];
    
    // Format response
    const formattedProduct = {
      id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      description: product.description,
      category: product.category,
      image: product.image,
      rating: {
        rate: parseFloat(product.rating_rate),
        count: product.rating_count
      }
    };

    res.json(formattedProduct);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create product (admin only - we'll keep it simple for now)
exports.createProduct = async (req, res) => {
  try {
    const { title, price, description, category, image, rating_rate, rating_count } = req.body;

    const result = await pool.query(
      'INSERT INTO products (title, price, description, category, image, rating_rate, rating_count) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, price, description, category, image, rating_rate || 0, rating_count || 0]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, description, category, image, rating_rate, rating_count } = req.body;

    const result = await pool.query(
      'UPDATE products SET title = $1, price = $2, description = $3, category = $4, image = $5, rating_rate = $6, rating_count = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
      [title, price, description, category, image, rating_rate, rating_count, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};