// Official upstream release assets; SHA-256 values copied from the GitHub release API.
// Update the version, URLs and all digests together after reviewing a new release.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmod, copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const version = '0.17.0';
const assets = {
  'x86_64-pc-windows-msvc': ['x86_64-pc-windows-msvc.zip', 'f61ce51f0b0ade1015b7de7ef368541c5424e9756ecbd0d7af97d6d48030845f'],
  'x86_64-unknown-linux-gnu': ['x86_64-unknown-linux-musl.tar.gz', '8533d07f9ccbd7a65824b9e0459041bca34af1eb33daba48f59215593753a3b7'],
  'aarch64-apple-darwin': ['aarch64-apple-darwin.tar.gz', 'a3f1cac7c5678f01661a92212f58480ae3b0634115d880dbc59e2953ded45667'],
  'x86_64-apple-darwin': ['x86_64-apple-darwin.tar.gz', '7c90ef5b6ddb1eb1937e4337add5237b79338e4b9676459fa91187d24d6cdf80'],
};
const target = process.argv[2];
const asset = assets[target];
if (!asset) throw new Error(`Unsupported Tectonic target: ${target}`);
const [suffix, expected] = asset;
if (!/^[a-f0-9]{64}$/.test(expected)) throw new Error('Missing pinned SHA-256');
const filename = `tectonic-${version}-${suffix}`;
const url = `https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${version}/${filename}`;
const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
if (!response.ok) throw new Error(`Tectonic download failed: HTTP ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
const actual = createHash('sha256').update(bytes).digest('hex');
if (actual !== expected) throw new Error(`Tectonic SHA-256 mismatch: ${actual}`);
const temporary = await mkdtemp(path.join(tmpdir(), 'scribetex-tectonic-'));
try {
  const archive = path.join(temporary, filename);
  const extracted = path.join(temporary, 'extracted');
  await mkdir(extracted);
  await writeFile(archive, bytes);
  execFileSync('tar', ['-xf', archive, '-C', extracted]);
  const entries = await readdir(extracted, { recursive: true, withFileTypes: true });
  const binaryName = target.includes('windows') ? 'tectonic.exe' : 'tectonic';
  const binaries = entries.filter(entry => entry.isFile() && entry.name === binaryName);
  if (binaries.length !== 1) throw new Error('Expected exactly one Tectonic binary');
  const engines = path.resolve('src-tauri/engines');
  await mkdir(engines, { recursive: true });
  for (const entry of entries.filter(entry => entry.isFile() && (entry.name === binaryName || entry.name.toLowerCase().endsWith('.dll')))) {
    const source = path.join(entry.parentPath ?? entry.path, entry.name);
    const destination = path.join(engines, entry.name);
    await copyFile(source, destination);
    if (entry.name === binaryName && !target.includes('windows')) await chmod(destination, 0o755);
  }
  await writeFile(path.join(engines, 'TECTONIC-PROVENANCE.txt'), `Tectonic ${version}\nSource: ${url}\nArchive SHA-256: ${expected}\nUpstream: https://github.com/tectonic-typesetting/tectonic\n`);
  await copyFile('.github/licenses/TECTONIC-LICENSE.txt', path.join(engines, 'TECTONIC-LICENSE.txt'));
  // CI-only overlay: base dev configuration never requires a downloaded binary.
  await writeFile('src-tauri/tauri.engine.conf.json', JSON.stringify({ bundle: { resources: { 'engines/': 'engines/' } } }, null, 2));
  console.log(`Prepared Tectonic ${version} for ${target}; verified SHA-256 ${actual}`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
