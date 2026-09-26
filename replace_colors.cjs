const fs = require('fs');
const path = require('path');

const replacements = {
  '#166534': '#395886',
  '#14532d': '#395886',
  '#dcfce7': '#D5DEEF',
  '#16a34a': '#628ECB',
  '#84cc16': '#8AAEE0',
  '#FAFFF8': '#F0F3FA',
  '#F0FDF4': '#D5DEEF',
  '#ECFDF5': '#B1C9EF',
  '#BBF7D0': '#8AAEE0',
  '#0f2918': '#395886',
  '#1a3d2b': '#395886',
  '#4b7a60': '#628ECB',
  '#86a495': '#8AAEE0',
  '#86efac': '#8AAEE0'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [oldColor, newColor] of Object.entries(replacements)) {
        const regex = new RegExp(oldColor, 'gi');
        if (regex.test(content)) {
          content = content.replace(regex, newColor);
          changed = true;
        }
      }
      
      const tailwindRegex = /\b(text|bg|border|ring|shadow)-green-(\d+)\b/g;
      if (tailwindRegex.test(content)) {
          content = content.replace(tailwindRegex, (match, prefix, shade) => {
              return `${prefix}-blue-${shade}`;
          });
          changed = true;
      }
      const limeRegex = /\b(text|bg|border|ring|shadow)-lime-(\d+)\b/g;
      if (limeRegex.test(content)) {
          content = content.replace(limeRegex, (match, prefix, shade) => {
              return `${prefix}-blue-${shade}`;
          });
          changed = true;
      }
      const amberRegex = /\b(text|bg|border|ring|shadow)-amber-(\d+)\b/g;
      if (amberRegex.test(content)) {
          content = content.replace(amberRegex, (match, prefix, shade) => {
              return `${prefix}-blue-${shade}`;
          });
          changed = true;
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDirectory('./src');
