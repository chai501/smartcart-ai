import React, { useState } from 'react';
import axios from 'axios';

const AMAZON_CATEGORIES = [
  'Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Sports & Outdoors',
  'Toys & Games', 'Beauty', 'Health & Household', 'Automotive', 'Pet Supplies',
  'Video Games', 'Office Products', 'Tools & Home Improvement', 'Garden & Outdoor'
];

const AuthModal = ({ isOpen, onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // step 1 = credentials, step 2 = preferences (register only)
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    favoriteProductTypes: [],
    buyFrequency: 'Low'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleCategory = (cat) => {
    setFormData(prev => ({
      ...prev,
      favoriteProductTypes: prev.favoriteProductTypes.includes(cat)
        ? prev.favoriteProductTypes.filter(c => c !== cat)
        : [...prev.favoriteProductTypes, cat]
    }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await axios.post(endpoint, formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      onLogin(res.data.user);
      onClose();
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resetAndSwitch = () => {
    setIsLogin(!isLogin);
    setStep(1);
    setError('');
    setFormData({ name: '', email: '', password: '', favoriteProductTypes: [], buyFrequency: 'Low' });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-surface border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-scale-in overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Step indicator for register */}
        {!isLogin && (
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step >= s ? 'bg-primary' : 'bg-white/10'}`} />
            ))}
          </div>
        )}

        <h2 className="text-3xl font-black mb-2">
          {isLogin ? 'Welcome Back' : step === 1 ? 'Join SmartCart' : 'Your Preferences'}
        </h2>
        <p className="text-gray-400 mb-8 text-sm">
          {isLogin
            ? 'Enter your details to access your personalized recommendations.'
            : step === 1
              ? 'Create an account to start your smart shopping journey.'
              : 'Help us personalize your Amazon recommendations.'}
        </p>

        {/* Step 1: Credentials */}
        {(isLogin || step === 1) && (
          <form onSubmit={isLogin ? handleSubmit : handleNext} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text" required
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email" required
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
              <input
                type="password" required
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primaryHover text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary/20 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isLogin ? 'Login' : 'Next →')}
            </button>
          </form>
        )}

        {/* Step 2: Preferences (register only) */}
        {!isLogin && step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                Favourite Product Types <span className="text-gray-600 normal-case font-normal">(pick any)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {AMAZON_CATEGORIES.map(cat => (
                  <button
                    type="button" key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      formData.favoriteProductTypes.includes(cat)
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/30'
                        : 'bg-background border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">How often do you shop online?</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'Low', label: 'Occasionally', icon: '🛍️', sub: '1–3 times/month' },
                  { value: 'Medium', label: 'Regularly', icon: '🛒', sub: '4–9 times/month' },
                  { value: 'High', label: 'Frequently', icon: '⚡', sub: '10+ times/month' }
                ].map(opt => (
                  <button
                    type="button" key={opt.value}
                    onClick={() => setFormData({ ...formData, buyFrequency: opt.value })}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      formData.buyFrequency === opt.value
                        ? 'bg-primary/20 border-primary text-white'
                        : 'bg-background border-white/10 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    <div className="text-xl mb-1">{opt.icon}</div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-surface border border-white/10 text-gray-300 py-3 rounded-xl font-bold transition-all hover:border-white/30"
              >
                ← Back
              </button>
              <button
                type="submit" disabled={loading}
                className="flex-[2] bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account 🚀'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center">
          <button onClick={resetAndSwitch} className="text-sm text-gray-400 hover:text-primary transition-colors font-medium">
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
