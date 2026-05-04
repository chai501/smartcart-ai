const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const User = require("./models/User");
const Product = require("./models/Product");
const UserAction = require("./models/UserAction");
const Order = require("./models/Order");
const jwt = require("jsonwebtoken");
const { getOrCreateProduct } = require("./utils/productGenerator");

dotenv.config();

const app = express();
app.use(express.json());

// --- CORS: allow both production and local development ---
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL // This will be your Vercel URL in production
].filter(Boolean); // Remove null/undefined if FRONTEND_URL isn't set yet

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) 
    // or if the origin is in our allowed list
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      console.error(`Blocked by CORS: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

const PORT = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION";

// ─────────────────────────────────────────────────────────────────────────────
//  Amazon Product Search  (via RapidAPI Real-Time Amazon Data, free tier)
//  Falls back to FakeStoreAPI if no API key is set.
// ─────────────────────────────────────────────────────────────────────────────
const searchAmazonProducts = async (query = "electronics", category = null) => {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (apiKey && apiKey !== "your_rapidapi_key") {
    try {
      console.log(`Searching Amazon via RapidAPI for: "${query}"`);
      const params = { query, country: "US", category_id: "aps" };
      if (category) params.category_id = category;

      const response = await axios.get(
        "https://real-time-amazon-data.p.rapidapi.com/search",
        {
          params,
          headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
          },
          timeout: 8000
        }
      );

      const results = response.data?.data?.products || [];
      return results.map(p => ({
        itemId: p.asin,
        name: p.product_title,
        price: parseFloat(p.product_price?.replace(/[^0-9.]/g, "")) || 19.99,
        imageUrl: p.product_photo || `https://images-na.ssl-images-amazon.com/images/P/${p.asin}.01.LZZZZZZZ.jpg`,
        category: p.product_category || query,
        description: p.product_description || `${p.product_title} — available on Amazon.`,
        rating: parseFloat(p.product_star_rating) || null,
        amazonUrl: p.product_url || `https://www.amazon.com/dp/${p.asin}`
      }));
    } catch (err) {
      console.warn("RapidAPI Amazon search failed, falling back:", err.message);
    }
  }

  // --- Fallback: Open FakeStoreAPI ---
  console.log("Using FakeStoreAPI fallback...");
  const response = await axios.get("https://fakestoreapi.com/products");
  return response.data.map(p => ({
    itemId: p.id.toString(),
    name: p.title,
    price: p.price,
    imageUrl: p.image,
    category: p.category,
    description: p.description,
    rating: p.rating?.rate || null,
    amazonUrl: null
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
//  Auth Middleware
// ─────────────────────────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Root
// ─────────────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Smart E-Commerce Backend Running", version: "2.0.0" });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Auth Routes
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, favoriteProductTypes, buyFrequency } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already exists" });

    const user = new User({
      name, email, password,
      favoriteProductTypes: favoriteProductTypes || [],
      buyFrequency: buyFrequency || "Low"
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        favoriteProductTypes: user.favoriteProductTypes,
        buyFrequency: user.buyFrequency
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        favoriteProductTypes: user.favoriteProductTypes,
        buyFrequency: user.buyFrequency
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Update user preferences
app.patch("/api/auth/preferences", auth, async (req, res) => {
  try {
    const { favoriteProductTypes, buyFrequency } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { favoriteProductTypes, buyFrequency },
      { new: true }
    ).select("-password");
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Products — Amazon-powered
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/products", async (req, res) => {
  try {
    const { q, category } = req.query;
    const searchQuery = q || category || "best sellers";

    const count = await Product.countDocuments();
    if (count === 0 || q || category) {
      console.log(`Fetching Amazon products for: "${searchQuery}"`);
      const amazonProducts = await searchAmazonProducts(searchQuery, category);

      // Upsert all products
      for (const p of amazonProducts) {
        await Product.findOneAndUpdate(
          { itemId: p.itemId },
          p,
          { upsert: true, new: true }
        );
      }
    }

    const query = {};
    if (category) query.category = { $regex: category, $options: "i" };
    if (q) query.name = { $regex: q, $options: "i" };

    const products = await Product.find(query).limit(24);
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Amazon product search endpoint (for real-time search)
app.get("/api/products/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query parameter required" });

    const products = await searchAmazonProducts(q);

    // Upsert into DB for future recommendations
    for (const p of products) {
      await Product.findOneAndUpdate({ itemId: p.itemId }, p, { upsert: true, new: true });
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Recommendations — ML service + user preferences boost
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/recommendations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user preferences to personalise the fallback
    const user = await User.findById(userId).select("favoriteProductTypes buyFrequency");
    const prefTypes = user?.favoriteProductTypes || [];

    // 1. Get raw recommendations from the Python ML service
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/recommend/${userId}?top_k=10`, {
      timeout: 5000
    });
    const recommendedItemIds = mlResponse.data.recommendations || [];

    // 2. Enrich with full product data
    const enrichedProducts = [];
    for (const itemId of recommendedItemIds) {
      if (itemId !== "#na#") {
        const product = await getOrCreateProduct(itemId);
        enrichedProducts.push(product);
      }
    }

    // 3. If user has preferences, also inject some preference-matched products
    if (prefTypes.length > 0 && enrichedProducts.length < 10) {
      const prefProducts = await Product.find({
        category: { $in: prefTypes.map(t => new RegExp(t, "i")) },
        itemId: { $nin: enrichedProducts.map(p => p.itemId) }
      }).limit(5);
      enrichedProducts.push(...prefProducts);
    }

    res.json({
      userId,
      recommendations: enrichedProducts.slice(0, 10),
      note: mlResponse.data.note,
      userPreferences: prefTypes
    });
  } catch (error) {
    console.error("Recommendations error:", error.message);
    // Graceful fallback: return popular products
    try {
      const user = await User.findById(req.params.userId).select("favoriteProductTypes");
      const prefTypes = user?.favoriteProductTypes || [];
      const query = prefTypes.length > 0
        ? { category: { $in: prefTypes.map(t => new RegExp(t, "i")) } }
        : {};
      const fallback = await Product.find(query).limit(8);
      res.json({ userId: req.params.userId, recommendations: fallback, note: "ML service unavailable, showing preference-based results" });
    } catch {
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Tracking
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/track", async (req, res) => {
  try {
    const { userId, productId, actionType } = req.body;
    if (!userId || !productId || !actionType) {
      return res.status(400).json({ error: "Missing required tracking data" });
    }

    const action = new UserAction({ userId, productId, actionType });
    await action.save();

    // Dynamically update user's buyFrequency based on purchase count
    if (actionType === "purchase") {
      const purchaseCount = await UserAction.countDocuments({ userId, actionType: "purchase" });
      const buyFrequency = purchaseCount >= 10 ? "High" : purchaseCount >= 4 ? "Medium" : "Low";
      await User.findByIdAndUpdate(userId, { buyFrequency });

      // Also update favoriteProductTypes from their purchase history
      const topCategories = await UserAction.aggregate([
        { $match: { userId, actionType: "purchase" } },
        { $lookup: { from: "products", localField: "productId", foreignField: "itemId", as: "product" } },
        { $unwind: "$product" },
        { $group: { _id: "$product.category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      const topTypes = topCategories.map(c => c._id).filter(Boolean);
      if (topTypes.length > 0) {
        await User.findByIdAndUpdate(userId, { favoriteProductTypes: topTypes });
      }
    }

    res.status(201).json({ message: "Action tracked successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to log action" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Trending
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/trending", async (req, res) => {
  try {
    const trendingActions = await UserAction.aggregate([
      { $match: { timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
      { $group: { _id: "$productId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);
    const productIds = trendingActions.map(a => a._id);
    let products = await Product.find({ itemId: { $in: productIds } });
    if (products.length === 0) products = await Product.find().limit(8);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trending products" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Analytics
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/analytics", async (req, res) => {
  try {
    const totalActions = await UserAction.countDocuments();
    const statsOverTime = await UserAction.aggregate([
      { $match: { timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, views: { $sum: { $cond: [{ $eq: ["$actionType", "view"] }, 1, 0] } }, carts: { $sum: { $cond: [{ $eq: ["$actionType", "add_to_cart"] }, 1, 0] } } } },
      { $sort: { _id: 1 } }
    ]);
    const topProducts = await UserAction.aggregate([
      { $group: { _id: "$productId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const enrichedTopProducts = [];
    for (const p of topProducts) {
      const details = await Product.findOne({ itemId: p._id });
      if (details) enrichedTopProducts.push({ name: details.name, count: p.count });
    }
    res.json({ totalActions, statsOverTime, topProducts: enrichedTopProducts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Checkout
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/checkout", async (req, res) => {
  try {
    const { userId, items, totalAmount } = req.body;
    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ error: "Empty cart or missing user ID" });
    }
    const order = new Order({ userId, items, totalAmount });
    await order.save();

    const trackings = items.map(item => ({
      userId,
      productId: item.itemId,
      actionType: "purchase",
      timestamp: new Date()
    }));
    await UserAction.insertMany(trackings);

    res.status(201).json({ message: "Order placed successfully", orderId: order._id });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Orders & User Stats
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/orders/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.get("/api/user-stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("favoriteProductTypes buyFrequency name email");
    const orders = await Order.find({ userId });
    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalItems = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
    const favoriteCategories = await UserAction.aggregate([
      { $match: { userId } },
      { $lookup: { from: "products", localField: "productId", foreignField: "itemId", as: "product" } },
      { $unwind: "$product" },
      { $group: { _id: "$product.category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.json({
      totalSpent,
      totalItems,
      totalOrders: orders.length,
      favoriteCategories,
      favoriteProductTypes: user?.favoriteProductTypes || [],
      buyFrequency: user?.buyFrequency || "Low"
    });
  } catch (error) {
    console.error("User stats error:", error);
    res.status(500).json({ error: "Failed to fetch user stats" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Database Connection — MongoDB Atlas preferred, in-memory fallback
// ─────────────────────────────────────────────────────────────────────────────
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (uri && !uri.includes("<user>")) {
    try {
      await mongoose.connect(uri);
      console.log("✅ Connected to MongoDB Atlas");
      return;
    } catch (err) {
      console.warn("MongoDB Atlas connection failed:", err.message);
    }
  }

  // Try local MongoDB
  try {
    await mongoose.connect("mongodb://localhost:27017/smart-ecommerce", {
      serverSelectionTimeoutMS: 2000
    });
    console.log("✅ Connected to local MongoDB");
    return;
  } catch {
    console.warn("Local MongoDB not available. Using In-Memory fallback.");
  }

  // Final fallback: in-memory (no data persistence between restarts)
  const { MongoMemoryServer } = require("mongodb-memory-server");
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log("⚠️  Connected to In-Memory MongoDB (data will NOT persist on restart)");
};

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Node server running on port ${PORT}`));
});
