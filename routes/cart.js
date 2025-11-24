const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');

// All cart routes require authentication

// Get user's cart
router.get('/', auth, cartController.getCart);

// Add item to cart
router.post('/', auth, cartController.addToCart);

// Update cart item quantity
router.put('/:id', auth, cartController.updateCartItem);

// Remove item from cart by product_id
router.delete('/:product_id', auth, cartController.removeFromCart);

// Clear entire cart
router.delete('/clear/all', auth, cartController.clearCart);

module.exports = router;