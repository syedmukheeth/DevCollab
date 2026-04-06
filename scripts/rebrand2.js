const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('dist')) {
        processDir(fullPath);
      }
    } else {
      if (
        fullPath.endsWith('.js') || 
        fullPath.endsWith('.jsx') || 
        fullPath.endsWith('.json') || 
        fullPath.endsWith('.sh') ||
        fullPath.endsWith('.yml') ||
        fullPath.endsWith('.html') ||
        fullPath.endsWith('.md')
      ) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let newContent = content;

        // Remove "Forge" everywhere it was injected next to SyncMesh
        newContent = newContent.replace(/SyncMesh/gi, 'SyncMesh');

        if (content !== newContent) {
          fs.writeFileSync(fullPath, newContent, 'utf8');
          console.log(`Removed Forge from: ${fullPath}`);
        }
      }
    }
  }
}

processDir(path.join(__dirname, '..'));
console.log('Forge Removal complete!');
