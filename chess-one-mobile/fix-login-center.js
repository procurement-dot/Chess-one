const fs = require('fs');
let c = fs.readFileSync('src/app/login.tsx', 'utf8');
c = c.replace(/scrollContent:\s*\{[\s\S]*?alignItems: 'center',\s*\}/, "scrollContent: {\n    flexGrow: 1,\n    justifyContent: 'center',\n    paddingHorizontal: 16,\n    paddingTop: 16,\n    paddingBottom: 40,\n    alignItems: 'center',\n  }");
fs.writeFileSync('src/app/login.tsx', c);
