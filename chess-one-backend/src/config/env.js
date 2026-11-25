require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 4000,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  JWT_SECRET: process.env.JWT_SECRET || "chessone-secret-key-change-in-prod",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "365d",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_ANDROID_CLIENT_ID:
    process.env.GOOGLE_ANDROID_CLIENT_ID ||
    "820629354206-9mugo6ruflcmtqtuacc7a81ouiuorv45.apps.googleusercontent.com",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:8081",
  NODE_ENV: process.env.NODE_ENV || "development",
  DEV_USER_ID: process.env.DEV_USER_ID ? parseInt(process.env.DEV_USER_ID, 10) : 1,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
};
