import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formulaTemplates, normalizeMath, templateDefaults, validateMath } from './math';
import { toLatex } from './latex';

describe('Composición matemática',()=>{
  for(const template of formulaTemplates){
    it(`representa y exporta la plantilla ${template.name}`,()=>{
      const formula=validateMath(template.build(templateDefaults(template)),!!template.block);
      assert.ok(formula.html.includes('katex'));
      const tex=toLatex({type:'doc',content:[{type:template.block?'blockMath':'inlineMath',attrs:{latex:formula.latex}}]});
      assert.ok(tex.includes(formula.latex));
      assert.ok(validateMath(template.sample,false).html.includes('katex'));
    });
  }
  it('normaliza símbolos y delimitadores copiados',()=>{
    assert.equal(normalizeMath('$$ α² ≤ π $$'),'\\alpha ^{2} \\leq  \\pi');
    assert.equal(validateMath('\\[\\frac{x}{2}\\]',true).latex,'\\frac{x}{2}');
  });
  it('acepta expresiones anidadas, matrices y alineación',()=>{
    for(const latex of ['\\frac{1}{1+\\frac{1}{x}}','\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}','\\begin{aligned}f(x)&=x^2\\\\f\'(x)&=2x\\end{aligned}','\\int_0^{\\infty} e^{-x}\\,dx=1']) assert.ok(validateMath(latex,true).html);
  });
  it('rechaza código de documentos, archivos, macros y HTML',()=>{
    for(const latex of ['\\input{secret}','\\includegraphics{secret}','\\write18{whoami}','\\def\\x{x}','\\href{https://example.com}{x}','\\htmlClass{a}{x}','\\begin{document}x\\end{document}','x % comment','x$y','\\csname input\\endcsname']) assert.throws(()=>validateMath(latex,true),/no |No |compatible|disponible/);
  });
  it('no inserta fórmulas incompletas ni enormes',()=>{
    for(const latex of ['','\\frac{x}{','x'.repeat(12001)]) assert.throws(()=>validateMath(latex));
  });
  it('escapa contenido de texto para la previsualización HTML',()=>{
    const result=validateMath('\\text{<script>alert(1)</script>}');
    assert.ok(!result.html.includes('<script>'));
  });
  it('limita las dimensiones de matrices recuperadas de un documento',()=>{
    const matrix=formulaTemplates.find(t=>t.id==='matrix')!;
    assert.ok(matrix.build({rows:'1000000',cols:'1000000'}).length<500);
  });
});
