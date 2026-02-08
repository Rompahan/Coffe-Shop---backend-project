const express = require('express');
const { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;