const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const auth = require('../middleware/auth');

// Get all products (public)
router.get('/', productsController.getAllProducts);

// Get single product (public)
router.get('/:id', productsController.getProductById);

// Create product (protected - for demo, no admin check)
router.post('/', auth, productsController.createProduct);

// Update product (protected)
router.put('/:id', auth, productsController.updateProduct);

// Delete product (protected)
router.delete('/:id', auth, productsController.deleteProduct);

module.exports = router;