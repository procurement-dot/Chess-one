require("dotenv").config();
const { Pool } = require("pg");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Crucial: Handle idle connection drop events so Supabase pooler drops don't crash Node.js process
pool.on("error", (err) => {
  console.warn("[PG Pool] Background idle client closed (auto-recovering):", err.message);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
