import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AMAZON_CATEGORIES = [
  'Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Sports & Outdoors',
  'Toys & Games', 'Beauty', 'Health & Household', 'Automotive', 'Pet Supplies',
  'Video Games', 'Office Products', 'Tools & Home Improvement', 'Garden & Outdoor'
];

const frequencyMeta = {
  Low: { label: 'Occasional', color: 'text-blue-400', icon: '🛍️' },
  Medium: { label: 'Regular', color: 'text-yellow-400', icon: '🛒' },
  High: { label: 'Frequent', color: 'text-green-400', icon: '⚡' }
};

const UserProfile = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [prefData, setPrefData] = useState({ favoriteProductTypes: [], buyFrequency: 'Low' });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (!user) return;
    setPrefData({
      favoriteProductTypes: user.favoriteProductTypes || [],
      buyFrequency: user.buyFrequency || 'Low'
    });

    const fetchData = async () => {
      try {
        const [ordersRes, statsRes] = await Promise.all([
          axios.get(`/api/orders/${user.id}`),
          axios.get(`/api/user-stats/${user.id}`)
        ]);
        setOrders(ordersRes.data);
        setStats(statsRes.data);
        // Sync latest preferences from server
        if (statsRes.data.favoriteProductTypes?.length > 0) {
          setPrefData({
            favoriteProductTypes: statsRes.data.favoriteProductTypes,
            buyFrequency: statsRes.data.buyFrequency || 'Low'
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const toggleCategory = (cat) => {
    setPrefData(prev => ({
      ...prev,
      favoriteProductTypes: prev.favoriteProductTypes.includes(cat)
        ? prev.favoriteProductTypes.filter(c => c !== cat)
        : [...prev.favoriteProductTypes, cat]
    }));
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      await axios.patch('/api/auth/preferences', prefData);
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...prefData }));
      setEditingPrefs(false);
    } catch (err) {
      console.error("Failed to save preferences", err);
    } finally {
      setSavingPrefs(false);
    }
  };

  if (!user) return (
    <div className="text-center py-20 glass-panel rounded-3xl">
      <h2 className="text-2xl font-bold">Please sign in to view your profile</h2>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const freq = frequencyMeta[stats?.buyFrequency || prefData.buyFrequency] || frequencyMeta.Low;

  return (
    <div className="space-y-12 animate-fade-in pt-10">
      {/* Profile Header */}
      <section className="glass-panel p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 border border-white/5">
        <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-4xl font-black shadow-lg shadow-primary/20">
          {user.name.charAt(0)}
        </div>
        <div className="text-center md:text-left flex-grow">
          <h2 className="text-4xl font-black">{user.name}</h2>
          <p className="text-gray-400">{user.email}</p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
            <span className="px-3 py-1 bg-surface rounded-full text-xs font-bold border border-white/5">Premium Member</span>
            <span className={`px-3 py-1 bg-surface rounded-full text-xs font-bold border border-white/5 ${freq.color}`}>
              {freq.icon} {freq.label} Shopper
            </span>
          </div>
        </div>
      </section>

      {/* Buying Preferences */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-primary">🎯</span> Shopping Preferences
          </h3>
          <button
            onClick={() => setEditingPrefs(!editingPrefs)}
            className="text-xs font-bold uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full hover:border-primary/50 hover:text-primary transition-all"
          >
            {editingPrefs ? 'Cancel' : 'Edit'}
          </button>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-5">
          {/* Favourite Product Types */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Favourite Categories</p>
            {editingPrefs ? (
              <div className="flex flex-wrap gap-2">
                {AMAZON_CATEGORIES.map(cat => (
                  <button
                    type="button" key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      prefData.favoriteProductTypes.includes(cat)
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/30'
                        : 'bg-background border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(stats?.favoriteProductTypes || prefData.favoriteProductTypes).length > 0
                  ? (stats?.favoriteProductTypes || prefData.favoriteProductTypes).map(cat => (
                    <span key={cat} className="px-3 py-1 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-full">{cat}</span>
                  ))
                  : <span className="text-gray-600 text-sm">No preferences set yet — we'll learn from your behaviour!</span>
                }
              </div>
            )}
          </div>

          {/* Buy Frequency */}
          {editingPrefs && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Shopping Frequency</p>
              <div className="flex gap-3">
                {Object.entries(frequencyMeta).map(([val, meta]) => (
                  <button
                    type="button" key={val}
                    onClick={() => setPrefData(p => ({ ...p, buyFrequency: val }))}
                    className={`flex-1 py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                      prefData.buyFrequency === val
                        ? 'bg-primary/20 border-primary text-white'
                        : 'bg-background border-white/10 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    {meta.icon} {meta.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {editingPrefs && (
            <button
              onClick={savePreferences} disabled={savingPrefs}
              className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              {savingPrefs ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Preferences'}
            </button>
          )}
        </div>
      </section>

      {/* User Analytics */}
      <section>
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="text-primary">📊</span> Your Shopping Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Total Invested</p>
            <p className="text-3xl font-black text-primary">${stats?.totalSpent?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Items Purchased</p>
            <p className="text-3xl font-black text-white">{stats?.totalItems || 0}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Top Category</p>
            <p className="text-2xl font-black text-accent truncate">
              {stats?.favoriteCategories?.[0]?._id || prefData.favoriteProductTypes[0] || 'N/A'}
            </p>
          </div>
        </div>
      </section>

      {/* Order History */}
      <section>
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="text-primary">📦</span> Order History
        </h3>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-2xl text-gray-500">
              You haven't placed any orders yet.
            </div>
          ) : (
            orders.map(order => (
              <div key={order._id} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Order ID</p>
                    <p className="text-sm font-mono text-white">#{order._id.substring(order._id.length - 8)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Date</p>
                    <p className="text-sm text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Status</p>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded uppercase">{order.status}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 uppercase">Total</p>
                    <p className="text-lg font-black text-primary">${order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {order.items.map((item, idx) => (
                    <img key={idx} src={item.imageUrl} title={item.name}
                      className="w-12 h-12 rounded-lg object-cover bg-background border border-white/5" alt={item.name} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default UserProfile;
