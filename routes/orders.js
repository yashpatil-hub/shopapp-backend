const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const auth = require('../middleware/auth');

// All order routes require authentication

// Create new order
router.post('/', auth, ordersController.createOrder);

// Get user's orders
router.get('/', auth, ordersController.getUserOrders);

// Get single order
router.get('/:id', auth, ordersController.getOrderById);

module.exports = router;