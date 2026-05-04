const mongoose = require('mongoose');

const userActionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  productId: {
    type: String,
    required: true
  },
  actionType: {
    type: String,
    enum: ['view', 'click', 'add_to_cart', 'purchase'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserAction', userActionSchema);
