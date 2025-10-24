import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Build with Vite
console.log('🏗️ Building with Vite...');
execSync('vite build', { stdio: 'inherit' });

// Copy JSON data files to dist folder
console.log('📁 Copying JSON data files...');
const dataDir = './js/data';
const distDataDir = './dist/js/data';

// Create directory structure
if (!fs.existsSync(distDataDir)) {
  fs.mkdirSync(distDataDir, { recursive: true });
}

// Copy all JSON files
const files = fs.readdirSync(dataDir);
files.forEach(file => {
  if (file.endsWith('.json')) {
    const sourcePath = path.join(dataDir, file);
    const destPath = path.join(distDataDir, file);
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied: ${file}`);
  }
});

// Copy content directory if it exists
const contentDir = './content';
const distContentDir = './dist/content';
if (fs.existsSync(contentDir)) {
  if (!fs.existsSync(distContentDir)) {
    fs.mkdirSync(distContentDir, { recursive: true });
  }
  
  const contentFiles = fs.readdirSync(contentDir);
  contentFiles.forEach(file => {
    const sourcePath = path.join(contentDir, file);
    const destPath = path.join(distContentDir, file);
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied content: ${file}`);
  });
}

console.log('🎉 Build completed successfully!');