const prisma = require("../config/database");

const USERS_TO_SEED = [
  { email: "organiser@chessone.local", name: "Test Organiser", role: "ORGANISER" },
  { email: "organiser2@chessone.local", name: "Test Organiser 2", role: "ORGANISER" },
  { email: "admin@chessone.local", name: "Test Admin", role: "ADMIN" },
  { email: "student1@chessone.local", name: "Student 1", role: "STUDENT" },
  { email: "student2@chessone.local", name: "Student 2", role: "STUDENT" },
  { email: "student3@chessone.local", name: "Student 3", role: "STUDENT" },
  { email: "student4@chessone.local", name: "Student 4", role: "STUDENT" },
  { email: "parent@chessone.local", name: "Test Parent", role: "PARENT" },
];

async function seed() {
  console.log("==================================================");
  console.log("🌱 Seeding RBAC Test Users");
  console.log("==================================================");

  const seededUsers = [];

  for (const item of USERS_TO_SEED) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        role: item.role,
        onboardingDone: true,
        name: item.name,
      },
      create: {
        email: item.email,
        name: item.name,
        role: item.role,
        onboardingDone: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        onboardingDone: true,
      },
    });
    seededUsers.push(user);
  }

  console.table(seededUsers, ["id", "name", "email", "role", "onboardingDone"]);
  console.log("✅ Seed completed successfully!");
}

seed()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
