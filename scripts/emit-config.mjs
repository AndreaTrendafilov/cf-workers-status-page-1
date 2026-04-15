import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'src', 'generated');
const outFile = join(outDir, 'config.json');

mkdirSync(outDir, { recursive: true });
const raw = readFileSync(join(root, 'config.yaml'), 'utf8');
const data = parse(raw);
writeFileSync(outFile, JSON.stringify(data, null, 2));
