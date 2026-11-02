const prisma = require('./config/prisma');

async function testApi() {
  console.log('Testing Supabase Puzzle database queries...');

  const total = await prisma.puzzle.count();
  console.log(`Verified DB count: ${total} puzzles`);

  // Test Foundation puzzles
  const foundation = await prisma.puzzle.findMany({
    where: { rating: { gte: 600, lte: 800 } },
    take: 3,
  });
  console.log(`Sample Foundation puzzles (600-800):`, foundation.map(p => ({ id: p.id, rating: p.rating, themes: p.themes })));

  // Test Pre-Intermediate puzzles
  const preInter = await prisma.puzzle.findMany({
    where: { rating: { gte: 801, lte: 1100 } },
    take: 3,
  });
  console.log(`Sample Pre-Intermediate puzzles (801-1100):`, preInter.map(p => ({ id: p.id, rating: p.rating, themes: p.themes })));

  // Test Advance puzzles
  const advance = await prisma.puzzle.findMany({
    where: { rating: { gte: 1701 } },
    take: 3,
  });
  console.log(`Sample Advance puzzles (1701+):`, advance.map(p => ({ id: p.id, rating: p.rating, themes: p.themes })));

  await prisma.$disconnect();
  console.log('All Supabase queries passed successfully!');
}

testApi().catch(e => {
  console.error(e);
  process.exit(1);
});
