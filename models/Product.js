const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['espresso', 'cappuccino', 'latte', 'tea', 'snack', 'iceLatte'],
    required: true
  },
  available: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 100
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);