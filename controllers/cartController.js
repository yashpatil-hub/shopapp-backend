const pool = require('../config/db');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.id as cart_item_id, ci.quantity, 
              p.id, p.title, p.price, p.description, p.category, p.image, 
              p.rating_rate, p.rating_count
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [req.userId]
    );

    // Format response to match frontend structure
    const cartItems = result.rows.map(item => ({
      id: item.id,
      title: item.title,
      price: parseFloat(item.price),
      description: item.description,
      category: item.category,
      image: item.image,
      rating: {
        rate: parseFloat(item.rating_rate),
        count: item.rating_count
      },
      quantity: item.quantity
    }));

    res.json(cartItems);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    // Check if product exists
    const productCheck = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if item already in cart
    const existingItem = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.userId, product_id]
    );

    let result;
    if (existingItem.rows.length > 0) {
      // Update quantity
      result = await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
        [quantity, req.userId, product_id]
      );
    } else {
      // Insert new item
      result = await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [req.userId, product_id, quantity]
      );
    }

    res.status(201).json({
      message: 'Item added to cart',
      cartItem: result.rows[0]
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({
      message: 'Cart item updated',
      cartItem: result.rows[0]
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { product_id } = req.params;

    const result = await pool.query(
      'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 RETURNING *',
      [req.userId, product_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM cart_items WHERE user_id = $1',
      [req.userId]
    );

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};