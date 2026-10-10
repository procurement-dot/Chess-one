const fs = require('fs');
let c = fs.readFileSync('src/app/login.tsx', 'utf8');
c = c.replace(/<View style=\{styles\.logoBadge\}>[\s\S]*?<\/View>/, '');
c = c.replace(/<Text style=\{styles\.appName\}>[\s\S]*?<\/Text>/, '<Image source={require(\'../../assets/images/chessone-logo.png\')} style={{ width: 180, height: 60, resizeMode: \'contain\', marginBottom: 12 }} />');
fs.writeFileSync('src/app/login.tsx', c);
