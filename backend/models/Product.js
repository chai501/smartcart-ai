const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  rating: {
    type: Number,
    default: null
  },
  amazonUrl: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
