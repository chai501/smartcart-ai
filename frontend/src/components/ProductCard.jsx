import React, { useEffect } from 'react';
import axios from 'axios';

const StarRating = ({ rating }) => {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= full ? 'text-yellow-400' : i === full + 1 && half ? 'text-yellow-300' : 'text-gray-600'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-[10px] text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart, userId }) => {
  // Track product view when component mounts
  useEffect(() => {
    if (userId && product.itemId) {
      axios.post('/api/track', {
        userId,
        productId: product.itemId,
        actionType: 'view'
      }).catch(err => console.error("Tracking error:", err));
    }
  }, [product.itemId, userId]);

  const handleAddToCart = () => {
    if (onAddToCart) onAddToCart(product);
    if (userId && product.itemId) {
      axios.post('/api/track', {
        userId,
        productId: product.itemId,
        actionType: 'add_to_cart'
      }).catch(err => console.error("Tracking error:", err));
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden group hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
      <div className="relative h-48 overflow-hidden bg-surface flex-shrink-0">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = `https://picsum.photos/seed/${product.itemId}/600/400`; }}
        />
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-semibold border border-white/10">
          {product.category || 'Featured'}
        </div>
        {/* Amazon badge */}
        {product.amazonUrl && (
          <a
            href={product.amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 left-2 bg-[#FF9900] text-black px-2 py-0.5 rounded text-[9px] font-black hover:bg-yellow-400 transition-colors"
            title="View on Amazon"
          >
            amazon
          </a>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-semibold text-sm text-white mb-1 line-clamp-2 leading-snug">{product.name}</h3>

        {/* Star rating */}
        <div className="mb-2">
          <StarRating rating={product.rating} />
        </div>

        <p className="text-gray-400 text-xs mb-4 line-clamp-2 flex-grow">{product.description}</p>

        <div className="flex items-center justify-between mt-auto gap-2">
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
          </span>
          <button
            onClick={handleAddToCart}
            className="bg-primary hover:bg-primaryHover text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
