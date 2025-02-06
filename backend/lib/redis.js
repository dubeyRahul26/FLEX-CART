// import staements 
import Redis from "ioredis";
import dotenv from "dotenv";

// dotenv configuration for reading environment variables from the .env file and use them in our application
dotenv.config() ;

// connecting to the redis server using the URL provided in the .env file
export const redis = new Redis(process.env.UPSTASH_REDIS_URL);
