const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');

const injectionCode = `
<style id="suppress-netlify-badge-global">
  #netlify-drawer-root,
  #netlify-drawer,
  [data-netlify-badge],
  [data-netlify-drawer],
  .netlify-badge,
  iframe[src*="netlify"],
  iframe[title*="Netlify"],
  iframe[id*="netlify"],
  a[href*="netlify.com"],
  div[id*="netlify"],
  div[class*="netlify-drawer"] {
    display: none !important;
    pointer-events: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    position: absolute !important;
    top: -9999px !important;
    left: -9999px !important;
    width: 0 !important;
    height: 0 !important;
    z-index: -999999 !important;
  }
</style>
<script>
  (function() {
    function purgeNetlifyBadge() {
      var sel = [
        '#netlify-drawer-root',
        '#netlify-drawer',
        '[data-netlify-badge]',
        '[data-netlify-drawer]',
        '.netlify-badge',
        'iframe[src*="netlify"]',
        'iframe[title*="Netlify"]',
        'iframe[id*="netlify"]',
        'a[href*="netlify.com"]',
        'div[id*="netlify"]',
        'div[class*="netlify-drawer"]'
      ];
      for (var i = 0; i < sel.length; i++) {
        var els = document.querySelectorAll(sel[i]);
        for (var j = 0; j < els.length; j++) {
          try { els[j].remove(); } catch(e) {}
        }
      }
    }
    purgeNetlifyBadge();
    window.addEventListener('DOMContentLoaded', purgeNetlifyBadge);
    window.addEventListener('load', purgeNetlifyBadge);
    setInterval(purgeNetlifyBadge, 500);
  })();
</script>
</head>`;

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('suppress-netlify-badge-global') && content.includes('</head>')) {
        content = content.replace('</head>', injectionCode);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Injected Netlify suppressor into: ${entry.name}`);
      }
    }
  }
}

processDirectory(distDir);
console.log('Finished injecting Netlify suppression into all dist HTML files.');
