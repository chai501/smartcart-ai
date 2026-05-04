const Product = require('../models/Product');

const categories = [
  'Electronics', 'Home & Kitchen', 'Sports & Outdoors', 
  'Video Games', 'Software', 'Books', 'Toys & Games', 
  'Pet Supplies', 'Health & Household', 'Automotive'
];

const generateProductData = (itemId) => {
  // Use the legacy Amazon image URL pattern which works for many ASINs/ISBNs
  // Fallback to picsum if it looks like it might not be a real ASIN
  const isPossiblyAsin = /^[A-Z0-9]{10}$/.test(itemId) || /^\d{10}$/.test(itemId);
  const imageUrl = isPossiblyAsin 
    ? `https://images-na.ssl-images-amazon.com/images/P/${itemId}.01.LZZZZZZZ.jpg`
    : `https://picsum.photos/seed/${itemId}/600/400`;

  const category = categories[Math.floor(Math.random() * categories.length)];
  const name = `${category} Essential - ${itemId.substring(0, 4)}`;
  const price = Math.floor(Math.random() * 500) + 15;

  return {
    itemId,
    name,
    price,
    imageUrl,
    category,
    description: `A high-quality item from our ${category} collection. Perfect for everyday use and built to last.`
  };
};

const getOrCreateProduct = async (itemId) => {
  let product = await Product.findOne({ itemId });
  if (!product) {
    product = new Product(generateProductData(itemId));
    await product.save();
  }
  return product;
};

module.exports = { getOrCreateProduct, generateProductData };
