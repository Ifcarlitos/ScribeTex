import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { toLatexProject } from '../../src/lib/latex';
import { formulaTemplates, templateDefaults } from '../../src/lib/math';

const output = path.resolve('src-tauri/target/pdf-smoke');
await mkdir(output, { recursive: true });
const image = await readFile('src-tauri/icons/32x32.png');
const text = (value: string) => ({ type: 'text', text: value });
const paragraph = (value: string) => ({ type: 'paragraph', content: [text(value)] });
const project = toLatexProject({ type: 'doc', content: [
  { type: 'heading', attrs: { level: 1 }, content: [text('ScribeTex: prueba de PDF')] },
  paragraph('Documento generado sin instalar TeX Live. Español: diseño, ecuación, información. 50% & precio $12.'),
  { type: 'paragraph', content: [{ type: 'text', text: 'Negrita, cursiva y subrayado', marks: [{ type: 'bold' }, { type: 'italic' }, { type: 'underline' }] }] },
  { type: 'blockMath', attrs: { latex: '\\frac{1}{2} + x^2 = 4' } },
  ...formulaTemplates.filter(template=>['integral','sum','limit','matrix','system','cases','quadratic'].includes(template.id)).flatMap(template=>[
    paragraph(template.name),
    {type:'blockMath',attrs:{latex:template.build(templateDefaults(template))}},
  ]),
  { type: 'table', content: [
    { type: 'tableRow', content: [{ type: 'tableHeader', content: [paragraph('Elemento')] }, { type: 'tableHeader', content: [paragraph('Valor')] }] },
    { type: 'tableRow', content: [{ type: 'tableCell', content: [paragraph('A & B')] }, { type: 'tableCell', content: [paragraph('42')] }] },
  ] },
  { type: 'image', attrs: { src: `data:image/png;base64,${image.toString('base64')}` } },
] });
await writeFile(path.join(output, 'sample.tex'), project.latex);
for (const asset of project.assets) await writeFile(path.join(output, asset.name), Buffer.from(asset.data));
const engine = path.resolve(`src-tauri/engines/tectonic${process.platform === 'win32' ? '.exe' : ''}`);
try {
  const log = execFileSync(engine, ['--untrusted', '--keep-logs', '--outdir', output, 'sample.tex'], {
    cwd: output, timeout: 300000, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, TECTONIC_CACHE_DIR: path.resolve('src-tauri/target/tectonic-cache') },
  });
  await writeFile(path.join(output, 'engine-output.txt'), log);
} catch (error) {
  await writeFile(path.join(output, 'engine-error.txt'), String(error));
  throw error;
}
const pdf = await readFile(path.join(output, 'sample.pdf'));
assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
assert.ok(pdf.length > 1000, 'Expected a real rendered PDF');
console.log(`Bundled Tectonic smoke passed: ${pdf.length} bytes; title, Spanish, text marks, equation, table and PNG.`);
