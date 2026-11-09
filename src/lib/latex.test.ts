import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeLatex, toLatex, toLatexProject } from './latex';

describe('Exportación LaTeX', () => {
  it('escapa texto reservado sin convertirlo en comandos', () => {
    assert.equal(escapeLatex('50% & $x_1$ \\input{secret}'), '50\\% \\& \\$x\\_1\\$ \\textbackslash{}input\\{secret\\}');
  });
  it('conserva marcas, títulos y caracteres españoles', () => {
    const tex = toLatex({ type: 'doc', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Diseño', marks: [{ type: 'bold' }] }] }] });
    assert.ok(tex.includes('\\subsection*{\\textbf{Diseño}}'));
    assert.ok(tex.includes('\\end{document}'));
  });
  it('separa filas y escapa el contenido de tablas', () => {
    const tex = toLatex({ type: 'doc', content: [{ type: 'table', content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A&B' }] }] }] }] }] });
    assert.ok(tex.includes('A\\&B \\\\\n\\hline'));
  });
  it('avisa de imágenes sin omitirlas silenciosamente', () => {
    assert.throws(() => toLatex({ type: 'doc', content: [{ type: 'image' }] }), /imágenes/);
  });
  it('genera recursos de imagen con rutas controladas para PDF', () => {
    const result = toLatexProject({type:'doc',content:[{type:'image',attrs:{src:'data:image/png;base64,iVBORw0KGgo='}}]});
    assert.equal(result.assets[0].name,'image-0.png');
    assert.deepEqual(result.assets[0].data,[137,80,78,71,13,10,26,10]);
    assert.ok(result.latex.includes('{image-0.png}'));
  });
  it('conserva margen, fuente, tamaño, color y alineación', () => {
    const tex = toLatex({type:'doc',content:[{type:'paragraph',attrs:{textAlign:'center'},content:[{type:'text',text:'Hola',marks:[{type:'textStyle',attrs:{fontFamily:'sans-serif',fontSize:'18pt',color:'#123456'}}]}]}]},{margin:15});
    for(const snippet of ['margin=15mm','\\centering','\\sffamily','\\fontsize{18}','\\textcolor[HTML]{123456}']) assert.ok(tex.includes(snippet),snippet);
  });
  it('exporta ecuaciones visuales y rechaza comandos externos', () => {
    assert.ok(toLatex({type:'doc',content:[{type:'inlineMath',attrs:{latex:'\\frac{a}{b}'}}]}).includes('\\(\\frac{a}{b}\\)'));
    assert.throws(()=>toLatex({type:'doc',content:[{type:'inlineMath',attrs:{latex:'\\input{secret}'}}]}),/ecuación/);
  });
});
