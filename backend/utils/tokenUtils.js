import { redis } from "../lib/redis.js";
import jwt from "jsonwebtoken";

// Generating access and refresh tokens for authentication using jwt (jsonwebtoken)
export const generateTokens = (userId) => {

    // Generating the access token
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    
    // generating the refresh token
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    
    // returning the access and refresh tokens
    return { accessToken, refreshToken };
  };
  
  // setting the refresh token in redis for faster access
  export const storeRefreshToken = async (userId, refreshToken) => {
    
    // setting the refresh token in redis for faster access
    await redis.set(
      `refresh_token:${userId}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60 // in milliseconds
    ); // expires in 7days
  };