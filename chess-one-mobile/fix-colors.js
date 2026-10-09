const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}
const files = [...walk('src/app/game'), ...walk('src/components/game'), ...walk('src/components/chess')];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  const importDepth = f.split('/').length - 2;
  const importPath = '../'.repeat(importDepth) + 'constants/chessone-theme';
  if (c.match(/#0F1318|#12161D|#1A1F26|#1E232A|#1E293B|#2563EB|#374151|#111827|#3B82F6|#60A5FA/g)) {
    c = c.replace(/#0F1318/g, 'COLORS.background')
         .replace(/#12161D/g, 'COLORS.white')
         .replace(/#1A1F26/g, 'COLORS.white')
         .replace(/#1E232A/g, 'COLORS.white')
         .replace(/#1E293B/g, 'COLORS.border')
         .replace(/#2563EB/g, 'COLORS.primary')
         .replace(/#374151/g, 'COLORS.border')
         .replace(/#111827/g, 'COLORS.white')
         .replace(/#3B82F6/g, 'COLORS.primary')
         .replace(/#60A5FA/g, 'COLORS.primary');
    c = c.replace(/'COLORS\./g, 'COLORS.')
         .replace(/\.background'/g, '.background')
         .replace(/\.white'/g, '.white')
         .replace(/\.border'/g, '.border')
         .replace(/\.primary'/g, '.primary');
    if (!c.includes('chessone-theme')) {
      c = `import { COLORS, SIZES, FONTS, SHADOWS } from '${importPath}';\n` + c;
    }
    fs.writeFileSync(f, c);
    console.log('Updated', f);
  }
});
