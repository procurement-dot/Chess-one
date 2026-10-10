const fs = require('fs');

function processFile(f) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/backgroundColor: '#064E3B'/g, "backgroundColor: '#ECFDF5'")
       .replace(/backgroundColor: '#1C150B'/g, "backgroundColor: '#FEF3C7'")
       .replace(/backgroundColor: '#451A03'/g, "backgroundColor: '#FEF2F2'")
       .replace(/backgroundColor: '#78350F'/g, "backgroundColor: '#FEF3C7'")
       .replace(/backgroundColor: '#2F3642'/g, "backgroundColor: 'COLORS.white'")
       .replace(/backgroundColor: '#262D38'/g, "backgroundColor: 'COLORS.white'")
       .replace(/color: '#FBBF24'/g, "color: '#D97706'")
       .replace(/color: '#FDE047'/g, "color: '#D97706'")
       .replace(/color: '#FEF08A'/g, "color: '#D97706'")
       .replace(/color: '#F87171'/g, "color: '#DC2626'")
       .replace(/color: '#34D399'/g, "color: '#059669'")
       .replace(/color: '#4ADE80'/g, "color: '#059669'")
       .replace(/color: '#9CA3AF'/g, "color: COLORS.textBody")
       .replace(/color: '#D1D5DB'/g, "color: COLORS.textHeading")
       .replace(/color: '#CBD5E1'/g, "color: COLORS.textBody")
       .replace(/color: '#F8FAFC'/g, "color: COLORS.textHeading")
       .replace(/backgroundColor: '#0F172A'/g, "backgroundColor: COLORS.white")
       .replace(/backgroundColor: '#161B22'/g, "backgroundColor: COLORS.white")
       .replace(/backgroundColor: '#1A202C'/g, "backgroundColor: COLORS.white")
       .replace(/backgroundColor: '#1A1A1A'/g, "backgroundColor: COLORS.white")
       .replace(/backgroundColor: '#2A323D'/g, "backgroundColor: COLORS.white")
       .replace(/backgroundColor: '#171B20'/g, "backgroundColor: COLORS.white")
       .replace(/backgroundColor: '#272E38'/g, "backgroundColor: COLORS.white")
       .replace(/backgroundColor: '#2A2A2D'/g, "backgroundColor: COLORS.white")
       .replace(/backgroundColor: '#1E1E1E'/g, "backgroundColor: COLORS.white")
       .replace(/backgroundColor: '#29292C'/g, "backgroundColor: COLORS.white")
       .replace(/backgroundColor: '#151921'/g, "backgroundColor: COLORS.white")
       .replace(/backgroundColor: '#1E1B4B'/g, "backgroundColor: COLORS.white")
       .replace(/backgroundColor: '#371E24'/g, "backgroundColor: COLORS.white")
       .replace(/'COLORS\.white'/g, "COLORS.white")
       .replace(/'COLORS\.border'/g, "COLORS.border")
       .replace(/'COLORS\.textHeading'/g, "COLORS.textHeading")
       .replace(/'COLORS\.textBody'/g, "COLORS.textBody");
  fs.writeFileSync(f, c);
}

processFile('src/app/game/[gameId].tsx');
processFile('src/app/game/result/[gameId].tsx');
