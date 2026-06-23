const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk(__dirname);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes('GUEST')) {
    content = content.replace(/\bVISITOR\b/g, 'GUEST');
    changed = true;
  }
  
  if (content.includes('EVENT_COORDINATOR')) {
    content = content.replace(/\bCOORDINATOR\b/g, 'EVENT_COORDINATOR');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
  }
});
