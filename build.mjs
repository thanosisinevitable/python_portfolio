import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const files=['dist/index.html','dist/style.css','dist/portfolio.css','dist/content.js','dist/app.js','dist/ui/favicon.svg','dist/ui/demo-placeholder.mp4','dist/ui/mono.ttf','dist/ui/mono-bold.ttf'];
for(const file of files)if(!existsSync(file))throw new Error(`Missing required file: ${file}`);
for(const file of ['dist/content.js','dist/app.js'])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('Ready: static portfolio files verified. Publish directory: dist');
