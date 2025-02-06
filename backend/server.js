// import statements
import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import paymentRoutes from "./routes/payment.route.js";
import path from "path";

// configuring dotenv to use environment variables
dotenv.config();

// creating an instance of express app
const app = express();

// using the PORT environment variable or 5000 as default port
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

// For parsing the json request body
app.use(express.json());

// for parsing the cookie request body
app.use(cookieParser());

// creating routes
app.use("/api/auth/", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/payments", paymentRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// starting the server on port provided in the environment variables or the default port
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  connectDB();
});
