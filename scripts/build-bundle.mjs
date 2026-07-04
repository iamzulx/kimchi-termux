// Resolve esbuild from node_modules (works with pnpm, npm, or yarn)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { build } = require('esbuild');
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Plugin to handle .md imports (like Bun's text import)
const mdPlugin = {
  name: 'md-plugin',
  setup(build) {
    build.onResolve({ filter: /\.md$/ }, (args) => {
      return {
        path: join(args.resolveDir, args.path),
        namespace: 'md-file',
      };
    });
    
    build.onLoad({ filter: /.*/, namespace: 'md-file' }, (args) => {
      const content = readFileSync(args.path, 'utf8');
      return {
        contents: `export default ${JSON.stringify(content)};`,
        loader: 'js',
      };
    });
  },
};

// Externalize native bindings
const external = [
  'node-pty',
  'playwright',
  'chromium-bidi',
  'electron',
  'fsevents',
  'bun:sqlite',
  'better-sqlite3',
  '@mariozechner/clipboard-darwin-arm64',
  '@mariozechner/clipboard-darwin-x64',
  '@mariozechner/clipboard-linux-arm64-gnu',
  '@mariozechner/clipboard-linux-arm64-musl',
  '@mariozechner/clipboard-linux-x64-gnu',
  '@mariozechner/clipboard-linux-x64-musl',
  '@mariozechner/clipboard-win32-arm64-msvc',
  '@mariozechner/clipboard-win32-x64-msvc',
];

await build({
  entryPoints: ['src/entry.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: 'dist/kimchi-bundle.mjs',
  external,
  plugins: [mdPlugin],
  minify: false,
  sourcemap: false,
  banner: {
    js: '// Kimchi Termux Build\nimport { createRequire as __kimchiCreateRequire } from "module";\nconst require = __kimchiCreateRequire(import.meta.url);\n',
  },
});

console.log('✓ Bundle created: dist/kimchi-bundle.mjs');
