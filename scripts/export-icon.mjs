import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { readFile, writeFile, copyFile } from 'node:fs/promises';

// Optional dependency directory allows using the web-app's installed package.
// Without an argument, uses this project's own devDependencies.
const require = createRequire(process.argv[2] ? join(resolve(process.argv[2]), 'package.json') : import.meta.url);
const { createElement } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { IconRefresh } = require('@tabler/icons-react');
const svg = renderToStaticMarkup(createElement(IconRefresh, {
  size: 28, stroke: 2, color: '#ffffff', 'aria-hidden': true,
}));
await writeFile(new URL('../public/assets/rotate.svg', import.meta.url), svg + '\n');
const htmlPath = new URL('../public/index.html', import.meta.url);
const html = await readFile(htmlPath, 'utf8');
await writeFile(htmlPath, html.replace(/<span class="hub">.*?<\/span>/s, `<span class="hub">${svg}</span>`));
const packagePath = require.resolve('@tabler/icons-react/package.json');
await copyFile(new URL('./LICENSE', 'file:///' + packagePath.replaceAll('\\', '/')), new URL('../public/assets/TABLER-LICENSE.txt', import.meta.url));
console.log('Exported IconRefresh from @tabler/icons-react.');
