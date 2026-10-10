const fs = require('fs');

function processFile(f) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/#0F1318/g, 'COLORS.background')
       .replace(/#161B22/g, 'COLORS.white')
       .replace(/#FFFFFF/g, 'COLORS.textHeading')
       .replace(/#94A3B8/g, 'COLORS.textBody')
       .replace(/#262D38/g, 'COLORS.border')
       .replace(/#64748B/g, 'COLORS.textBody')
       .replace(/#374151/g, 'COLORS.border')
       .replace(/#1E293B/g, 'COLORS.border')
       .replace(/#0F172A/g, 'COLORS.white');

  c = c.replace(/'COLORS\.background'/g, 'COLORS.background')
       .replace(/'COLORS\.white'/g, 'COLORS.white')
       .replace(/'COLORS\.textHeading'/g, 'COLORS.textHeading')
       .replace(/'COLORS\.textBody'/g, 'COLORS.textBody')
       .replace(/'COLORS\.border'/g, 'COLORS.border');

  if (!c.includes('chessone-theme')) {
    c = "import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/chessone-theme';\n" + c;
  }
  fs.writeFileSync(f, c);
}

processFile('src/app/login.tsx');
