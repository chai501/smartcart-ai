import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get('/api/analytics');
        setData(response.data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!data) return <div className="text-center py-20 text-gray-500">No data available yet.</div>;

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8 animate-fade-in py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Interactions</p>
          <h3 className="text-4xl font-black text-white">{data.totalActions}</h3>
          <div className="mt-4 flex items-center text-green-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>12% from yesterday</span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Conversion Rate</p>
          <h3 className="text-4xl font-black text-white">4.2%</h3>
          <div className="mt-4 flex items-center text-primary text-sm">
            <span>Stable performing</span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">AI Accuracy</p>
          <h3 className="text-4xl font-black text-white">92%</h3>
          <div className="mt-4 flex items-center text-accent text-sm">
            <span>High confidence</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-3xl">
          <h4 className="text-xl font-bold mb-8">User Engagement (Last 7 Days)</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.statsOverTime}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="_id" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="views" stroke="#3b82f6" fillOpacity={1} fill="url(#colorViews)" strokeWidth={3} />
                <Area type="monotone" dataKey="carts" stroke="#8b5cf6" fillOpacity={0} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl">
          <h4 className="text-xl font-bold mb-8">Most Interacted Products</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#ffffff80" fontSize={10} width={100} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
