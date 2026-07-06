// Build script for Termux — portable esbuild resolution
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dirname, '..', 'package.json'));

let build;
try {
  ({ build } = require('esbuild'));
} catch {
  const fallback = join(
    process.env.HOME || '',
    'kimchi/node_modules/.pnpm/esbuild@0.27.7/node_modules/esbuild/lib/main.js',
  );
  ({ build } = await import(fallback));
}

if (!existsSync('dist')) mkdirSync('dist');

const mdPlugin = {
  name: 'md-plugin',
  setup(b) {
    b.onResolve({ filter: /\.md$/ }, (args) => ({
      path: join(args.resolveDir, args.path),
      namespace: 'md-file',
    }));
    b.onLoad({ filter: /.*/, namespace: 'md-file' }, (args) => ({
      contents: `export default ${JSON.stringify(readFileSync(args.path, 'utf8'))};`,
      loader: 'js',
    }));
  },
};

const bodiesGenPlugin = {
  name: 'bodies-gen',
  setup(b) {
    b.onResolve({ filter: /bodies\/.*\.md$/ }, (args) => {
      const jsPath = args.path
        .replace('/bodies/', '/bodies-gen/')
        .replace('.md', '.js');
      return { path: jsPath };
    });
  },
};

const external = [
  'node-pty', 'playwright', 'chromium-bidi', 'electron', 'fsevents',
  'bun:sqlite', 'better-sqlite3', 'node:sqlite',
  '@mariozechner/clipboard-darwin-arm64', '@mariozechner/clipboard-darwin-x64',
  '@mariozechner/clipboard-linux-arm64-gnu', '@mariozechner/clipboard-linux-arm64-musl',
  '@mariozechner/clipboard-linux-x64-gnu', '@mariozechner/clipboard-linux-x64-musl',
  '@mariozechner/clipboard-win32-arm64-msvc', '@mariozechner/clipboard-win32-x64-msvc',
  '@xterm/headless',
];

console.log('Building kimchi-bundle.mjs ...');
const result = await build({
  entryPoints: ['src/entry.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: 'dist/kimchi-bundle.mjs',
  external,
  plugins: [bodiesGenPlugin, mdPlugin],
  minify: false,
  sourcemap: false,
  logLevel: 'warning',
  banner: {
    js: `// Kimchi Termux Build — Node.js ESM bundle
import { createRequire as __kimchiCreateRequire } from "module";
const require = __kimchiCreateRequire(import.meta.url);
`,
  },
});

console.log(`✓ Bundle created: dist/kimchi-bundle.mjs (${result.errors.length} errors, ${result.warnings.length} warnings)`);