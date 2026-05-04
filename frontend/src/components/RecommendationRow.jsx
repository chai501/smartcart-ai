import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';

const RecommendationRow = ({ userId, onAddToCart }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!userId) return;
    
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/recommendations/${userId}`);
        setRecommendations(response.data.recommendations || []);
        if (response.data.note) {
          setNote(response.data.note);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load AI recommendations. Make sure the ML service is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId]);

  if (!userId) return null;

  return (
    <section className="my-16 animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="bg-accent/20 text-accent p-2 rounded-lg">✨</span> 
            Recommended for You
          </h2>
          <p className="text-gray-400 mt-2">
            Personalized picks powered by our FastAI Collaborative Filtering engine.
          </p>
          {note && <p className="text-accent text-sm mt-1">{note}</p>}
        </div>
        <div className="text-sm px-4 py-2 bg-surface rounded-full border border-white/5">
          Viewing as: <span className="font-mono text-primary">{userId}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 glass-panel rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
          {error}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center p-12 glass-panel rounded-2xl text-gray-400">
          No recommendations found for this user.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {recommendations.map((product, idx) => (
            <div key={product._id || product.itemId || idx} className="animate-fade-in" style={{ animationDelay: (idx * 100) + 'ms' }}>
              <ProductCard 
                product={product} 
                userId={userId} 
                onAddToCart={onAddToCart} 
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecommendationRow;
