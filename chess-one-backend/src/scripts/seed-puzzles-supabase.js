const fs = require('fs');
const path = require('path');
const readline = require('readline');
const prisma = require('../config/prisma');

async function seedPuzzles() {
  const csvPath = path.join(__dirname, '../../prisma/lichess_puzzle_sample_32k.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found at:', csvPath);
    process.exit(1);
  }

  console.log('Connecting to Supabase...');
  await prisma.$connect();
  console.log('Connected! Checking existing puzzle count...');
  const existingCount = await prisma.puzzle.count();
  console.log(`Existing puzzles in database: ${existingCount}`);

  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers = null;
  let batch = [];
  let totalProcessed = 0;
  let totalInserted = 0;
  const BATCH_SIZE = 1000;

  const startTime = Date.now();

  for await (const line of rl) {
    if (!line.trim()) continue;

    if (!headers) {
      headers = line.split(',').map(h => h.trim());
      continue;
    }

    // Split CSV line handling quotes if any
    const values = [];
    let insideQuote = false;
    let currentVal = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    if (!row.PuzzleId || !row.FEN || !row.Moves) continue;

    batch.push({
      id: row.PuzzleId,
      fen: row.FEN,
      moves: row.Moves,
      rating: parseInt(row.Rating, 10) || 1200,
      ratingDeviation: row.RatingDeviation ? parseInt(row.RatingDeviation, 10) : null,
      popularity: row.Popularity ? parseInt(row.Popularity, 10) : null,
      nbPlays: row.NbPlays ? parseInt(row.NbPlays, 10) : null,
      themes: row.Themes || '',
      gameUrl: row.GameUrl || null,
      openingTags: row.OpeningTags || null,
    });

    totalProcessed++;

    if (batch.length >= BATCH_SIZE) {
      try {
        const res = await prisma.puzzle.createMany({
          data: batch,
          skipDuplicates: true,
        });
        totalInserted += res.count;
        process.stdout.write(`\rInserted ${totalInserted} / ${totalProcessed} puzzles...`);
      } catch (err) {
        console.error(`\nError inserting batch:`, err.message);
      }
      batch = [];
    }
  }

  if (batch.length > 0) {
    try {
      const res = await prisma.puzzle.createMany({
        data: batch,
        skipDuplicates: true,
      });
      totalInserted += res.count;
    } catch (err) {
      console.error(`\nError inserting final batch:`, err.message);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n✅ Bulk upload finished in ${durationSec}s!`);
  const finalCount = await prisma.puzzle.count();
  console.log(`Total puzzles in Supabase now: ${finalCount}`);

  await prisma.$disconnect();
}

seedPuzzles().catch((e) => {
  console.error('Fatal error in seedPuzzles:', e);
  process.exit(1);
});
