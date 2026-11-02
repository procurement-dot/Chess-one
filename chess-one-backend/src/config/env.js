require("dotenv").config();

const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_SECRET = process.env.JWT_SECRET || "chessone-secret-key-change-in-prod";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

if (NODE_ENV === "production") {
  if (!process.env.JWT_SECRET || JWT_SECRET === "chessone-secret-key-change-in-prod") {
    throw new Error("FATAL: JWT_SECRET must be securely configured in production environment.");
  }
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("FATAL: GOOGLE_CLIENT_ID must be configured in production environment.");
  }
}

const qaAllowedRaw = process.env.QA_ALLOWED_EMAILS || "";
const QA_ALLOWED_EMAILS = qaAllowedRaw
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

module.exports = {
  PORT: process.env.PORT || 4000,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",
  GOOGLE_CLIENT_ID,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:8081",
  NODE_ENV,
  DEV_USER_ID: process.env.DEV_USER_ID ? parseInt(process.env.DEV_USER_ID, 10) : 1,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",

  // Phase 0 Class module & QA foundation settings
  ENABLE_TEST_LOGIN: process.env.ENABLE_TEST_LOGIN || "false",
  QA_LOGIN_SECRET: process.env.QA_LOGIN_SECRET || "",
  QA_ALLOWED_EMAILS,
  CLASS_MAX_STUDENTS_DEFAULT: parseInt(process.env.CLASS_MAX_STUDENTS_DEFAULT || "30", 10),
  SESSION_LATE_AFTER_MIN: parseInt(process.env.SESSION_LATE_AFTER_MIN || "10", 10),
  CLASS_CHAT_RATE_LIMIT_MS: parseInt(process.env.CLASS_CHAT_RATE_LIMIT_MS || "1000", 10),
};
