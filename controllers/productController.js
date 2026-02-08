const Product = require('../models/Product');

const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json({
      message: 'Products retrieved',
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({
      message: 'Product retrieved',
      product
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    
    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }
    
    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      stock: stock || 100,
      available: true
    });
    
    res.status(201).json({
      message: 'Product created',
      product
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const updates = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({
      message: 'Product updated',
      product
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({
      message: 'Product deleted',
      productId: req.params.id
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};