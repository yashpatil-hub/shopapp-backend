const pool = require('../config/db');

// Create new order
exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { items, shipping_info } = req.body;
    const { fullName, email, phone, address, city, zipCode } = shipping_info;

    // Start transaction
    await client.query('BEGIN');

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO orders 
       (user_id, order_number, total_amount, status, shipping_name, shipping_email, shipping_phone, shipping_address, shipping_city, shipping_zipcode) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [req.userId, orderNumber, totalAmount, 'pending', fullName, email, phone, address, city, zipCode]
    );

    const order = orderResult.rows[0];

    // Insert order items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items 
         (order_id, product_id, product_title, product_price, quantity) 
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.id, item.title, item.price, item.quantity || 1]
      );
    }

    // Clear user's cart
    await client.query(
      'DELETE FROM cart_items WHERE user_id = $1',
      [req.userId]
    );

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order.id,
        orderNumber: order.order_number,
        totalAmount: parseFloat(order.total_amount),
        status: order.status,
        shippingInfo: {
          fullName: order.shipping_name,
          email: order.shipping_email,
          phone: order.shipping_phone,
          address: order.shipping_address,
          city: order.shipping_city,
          zipCode: order.shipping_zipcode
        },
        createdAt: order.created_at,
        items: items
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const ordersResult = await pool.query(
      `SELECT * FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.userId]
    );

    const orders = [];

    for (const order of ordersResult.rows) {
      // Get order items
      const itemsResult = await pool.query(
        `SELECT oi.*, p.image, p.category 
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      );

      orders.push({
        id: order.id,
        orderNumber: order.order_number,
        totalAmount: parseFloat(order.total_amount),
        status: order.status,
        shippingInfo: {
          fullName: order.shipping_name,
          email: order.shipping_email,
          phone: order.shipping_phone,
          address: order.shipping_address,
          city: order.shipping_city,
          zipCode: order.shipping_zipcode
        },
        createdAt: order.created_at,
        items: itemsResult.rows.map(item => ({
          id: item.product_id,
          title: item.product_title,
          price: parseFloat(item.product_price),
          quantity: item.quantity,
          image: item.image,
          category: item.category
        }))
      });
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single order
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await pool.query(
      `SELECT oi.*, p.image, p.category 
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order.id]
    );

    res.json({
      id: order.id,
      orderNumber: order.order_number,
      totalAmount: parseFloat(order.total_amount),
      status: order.status,
      shippingInfo: {
        fullName: order.shipping_name,
        email: order.shipping_email,
        phone: order.shipping_phone,
        address: order.shipping_address,
        city: order.shipping_city,
        zipCode: order.shipping_zipcode
      },
      createdAt: order.created_at,
      items: itemsResult.rows.map(item => ({
        id: item.product_id,
        title: item.product_title,
        price: parseFloat(item.product_price),
        quantity: item.quantity,
        image: item.image,
        category: item.category
      }))
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};