const prisma = require("./config/prisma");

async function testDatabase() {
  try {
    await prisma.$connect();

    console.log("✅ Supabase PostgreSQL connected!");

    const users = await prisma.user.findMany();

    console.log("Users:", users);
  } catch (error) {
    console.error("❌ Database connection failed");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
