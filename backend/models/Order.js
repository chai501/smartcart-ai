const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  items: [{
    itemId: String,
    name: String,
    price: Number,
    quantity: Number,
    imageUrl: String
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'completed'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
