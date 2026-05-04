import React, { useState, useEffect } from 'react';
import axios from 'axios';

// In production the Vite build injects VITE_API_URL (e.g. https://my-backend.onrender.com).
// In development the Vite proxy handles /api → localhost:5000, so baseURL stays empty.
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import RecommendationRow from './components/RecommendationRow';
import UserProfile from './components/UserProfile';
import AuthModal from './components/AuthModal';

function App() {
  const [products, setProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' or 'profile'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Set default axios headers if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [user]);

  const mockUserId = user ? user.id : 'anonymous_guest';

  // Fetch standard catalog and trending products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catalogRes, trendingRes] = await Promise.all([
          axios.get('/api/products'),
          axios.get('/api/trending')
        ]);
        setProducts(catalogRes.data);
        setTrendingProducts(trendingRes.data);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.itemId === product.itemId);
      if (existing) {
        return prev.map(item => item.itemId === product.itemId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.itemId !== itemId));
  };

  const handleCheckout = async () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    
    setIsCheckingOut(true);
    try {
      await axios.post('/api/checkout', {
        userId: user.id,
        items: cart,
        totalAmount: cartTotal
      });
      
      setCart([]);
      setIsCheckoutSuccess(true);
      setTimeout(() => {
        setIsCheckoutSuccess(false);
        setIsCartOpen(false);
      }, 3000);
    } catch (err) {
      console.error("Checkout failed", err);
      alert("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30">
      {/* Top Navigation */}
      <nav className="glass-panel sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-sm">S</span>
            Smart<span className="text-primary">Cart</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="bg-surface/50 border border-white/10 rounded-full p-1 flex gap-1">
              <button 
                onClick={() => setActiveTab('shop')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'shop' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Shop
              </button>
              <button 
                onClick={() => user ? setActiveTab('profile') : setIsAuthOpen(true)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'profile' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Profile
              </button>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-surface border border-white/10 rounded-full px-4 py-2 w-64 focus-within:w-80 transition-all focus-within:border-primary/50 group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search products..." 
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white placeholder:text-gray-600"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'shop') setActiveTab('shop');
                }}
              />
            </div>

            {user ? (
              <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Member</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="bg-surface hover:bg-red-500/10 border border-white/10 p-2 rounded-full transition-all group"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthOpen(true)}
                className="bg-primary hover:bg-primaryHover text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-primary/20 transition-all ml-4"
              >
                Sign In
              </button>
            )}

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-white/5 rounded-full transition-colors group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-lg shadow-primary/50">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pb-20">
        {activeTab === 'shop' ? (
          <>
            <Hero />
            
            {/* ML Recommendation Section */}
            <RecommendationRow userId={mockUserId} onAddToCart={addToCart} />

            {/* Trending Section */}
            {trendingProducts.length > 0 && (
              <section className="my-16">
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                  <span className="text-orange-500">🔥</span> Trending Now
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {trendingProducts.map(product => (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      userId={mockUserId} 
                      onAddToCart={addToCart} 
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Standard Catalog Section */}
            <section id="explore" className="my-16 scroll-mt-24">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h2 className="text-3xl font-bold text-white">Explore Everything</h2>
                <div className="flex flex-wrap gap-2">
                  {['All', ...new Set(products.map(p => p.category))].map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                        selectedCategory === cat 
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                        : 'bg-surface border-white/5 text-gray-400 hover:text-white hover:bg-surfaceHover'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {products
                  .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
                  .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(product => (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      userId={mockUserId} 
                      onAddToCart={addToCart} 
                    />
                  ))
                }
              </div>
            </section>
          </>
        ) : (
          <UserProfile user={user} />
        )}
      </main>

      {/* Cart Drawer */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
        <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-surface border-l border-white/10 shadow-2xl transition-transform duration-500 ease-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <p className="text-4xl mb-4">🛒</p>
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.itemId} className="flex gap-4 items-center animate-fade-in">
                    <img src={item.imageUrl} className="w-16 h-16 rounded-lg object-cover bg-background" alt={item.name} />
                    <div className="flex-grow">
                      <h4 className="font-semibold text-white truncate w-40">{item.name}</h4>
                      <p className="text-gray-400 text-sm">${item.price} x {item.quantity}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.itemId)}
                      className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-white/10 space-y-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">${cartTotal.toFixed(2)}</span>
              </div>
              
              {isCheckoutSuccess ? (
                <div className="bg-green-500/20 border border-green-500/30 p-4 rounded-xl text-center animate-bounce">
                  <p className="text-green-400 font-bold">Order Placed Successfully! 🎉</p>
                </div>
              ) : (
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isCheckingOut}
                  className="w-full bg-primary hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isCheckingOut ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Checkout Now'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLogin={setUser} 
      />

      <footer className="border-t border-white/10 py-12 bg-surface/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <div className="text-xl font-black mb-4">Smart<span className="text-primary">Cart</span></div>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
            Real-time behavioral tracking and AI recommendations integrated into a premium MERN stack experience.
          </p>
          <div className="text-gray-600 text-[10px] uppercase tracking-[0.2em]">
            &copy; 2026 SmartCart AI. Built with FastAI & React.
          </div>
        </div>
      </footer>
    </div>
  );
}


export default App;
