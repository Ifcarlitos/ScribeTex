import katex from 'katex';

// This shared subset supports both KaTeX preview and the amsmath PDF output.
// Commands that load files, define macros, link URLs or inject HTML are excluded.
const commands = new Set(`frac dfrac tfrac cfrac binom dbinom tbinom sqrt left right middle big Big bigg Bigg bigl bigr Bigl Bigr biggl biggr Biggl Biggr over under overset underset overline underline overbrace underbrace vec hat widehat bar tilde widetilde dot ddot acute grave breve check mathring text textrm textsf texttt textbf textit mathrm mathsf mathtt mathbf mathit mathnormal mathcal mathbb mathfrak boldsymbol operatorname displaystyle textstyle scriptstyle scriptscriptstyle limits nolimits sum prod coprod int iint iiint oint lim limsup liminf min max inf sup sin cos tan cot sec csc arcsin arccos arctan sinh cosh tanh coth log ln exp det dim ker hom gcd Pr arg deg mod bmod pmod pod alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta iota kappa lambda mu nu xi pi varpi rho varrho sigma varsigma tau upsilon phi varphi chi psi omega Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega infty partial nabla ell hbar imath jmath Re Im wp emptyset varnothing aleph forall exists nexists neg land lor wedge vee cap cup bigcap bigcup subset supset subseteq supseteq in notin ni setminus smallsetminus le leq ge geq ne neq approx sim simeq equiv cong propto asymp ll gg lesssim gtrsim prec succ preceq succeq parallel perp mid nmid models vdash dashv to mapsto rightarrow leftarrow leftrightarrow Rightarrow Leftarrow Leftrightarrow longrightarrow longleftarrow longleftrightarrow Longrightarrow Longleftarrow Longleftrightarrow uparrow downarrow updownarrow hookrightarrow hookleftarrow cdot cdots ldots vdots ddots times div pm mp ast star circ bullet oplus otimes odot oslash bigoplus bigotimes angle triangle triangleleft triangleright square Diamond lbrace rbrace lvert rvert lVert rVert langle rangle lfloor rfloor lceil rceil vert Vert backslash colon quad qquad enspace thinspace medspace thickspace negthinspace phantom hphantom vphantom smash mathstrut substack begin end tag not`.split(/\s+/));
const environments = new Set(['matrix','pmatrix','bmatrix','Bmatrix','vmatrix','Vmatrix','smallmatrix','cases','aligned','alignedat','gathered']);
const unicode: Record<string,string> = {
  'ζ':'\\zeta ', 'η':'\\eta ', 'ι':'\\iota ', 'κ':'\\kappa ', 'ν':'\\nu ', 'ξ':'\\xi ', 'ρ':'\\rho ', 'τ':'\\tau ', 'υ':'\\upsilon ', 'χ':'\\chi ', 'ψ':'\\psi ', 'ο':'o', 'Γ':'\\Gamma ', 'Θ':'\\Theta ', 'Λ':'\\Lambda ', 'Ξ':'\\Xi ', 'Π':'\\Pi ', 'Υ':'\\Upsilon ', 'Φ':'\\Phi ', 'Ψ':'\\Psi ', 'ℝ':'\\mathbb{R}', 'ℕ':'\\mathbb{N}', 'ℤ':'\\mathbb{Z}', 'ℚ':'\\mathbb{Q}', 'ℂ':'\\mathbb{C}',
  'α':'\\alpha ', 'β':'\\beta ', 'γ':'\\gamma ', 'δ':'\\delta ', 'ε':'\\epsilon ', 'θ':'\\theta ', 'λ':'\\lambda ', 'μ':'\\mu ', 'σ':'\\sigma ', 'φ':'\\phi ', 'ω':'\\omega ', 'π':'\\pi ', 'Δ':'\\Delta ', 'Σ':'\\Sigma ', 'Ω':'\\Omega ', '∞':'\\infty ', '∑':'\\sum ', '∏':'\\prod ', '∫':'\\int ', '√':'\\sqrt ', '±':'\\pm ', '×':'\\times ', '·':'\\cdot ', '÷':'\\div ', '≤':'\\leq ', '≥':'\\geq ', '≠':'\\neq ', '≈':'\\approx ', '∈':'\\in ', '∉':'\\notin ', '→':'\\to ', '⇒':'\\Rightarrow ', '∂':'\\partial ', '∇':'\\nabla ', '−':'-', '²':'^{2}', '³':'^{3}',
};

export function normalizeMath(source: string): string {
  let value = source.trim();
  for (const [start,end] of [['$$','$$'],['\\[','\\]'],['\\(','\\)'],['$','$']]) {
    if(value.startsWith(start) && value.endsWith(end) && value.length >= start.length+end.length) {value=value.slice(start.length,-end.length).trim();break;}
  }
  return Array.from(value, char => unicode[char] ?? char).join('').trim();
}

export function validateMath(source: string, displayMode = false): { latex: string; html: string } {
  if(source.length > 12000) throw Error('La fórmula supera el límite de 12.000 caracteres.');
  const latex = normalizeMath(source);
  if(!latex) throw Error('Escribe una expresión para ver la fórmula.');
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(latex)) throw Error('La fórmula contiene caracteres de control no válidos.');
  if(/(^|[^\\])[%$#]/.test(latex)) throw Error('No uses delimitadores, comentarios ni # dentro de la expresión.');
  for(const match of latex.matchAll(/\\([a-zA-Z]+|[^a-zA-Z])/g)) {
    const command = match[1];
    if(!commands.has(command) && !['\\','{','}','|',',',';',':','!',' ','%','_','#','&'].includes(command)) {
      throw Error(`El comando \\${command} no está disponible en las fórmulas de ScribeTex.`);
    }
  }
  for(const match of latex.matchAll(/\\(?:begin|end)\s*\{([^}]*)\}/g)) {
    if(!environments.has(match[1])) throw Error(`El entorno ${match[1]} no es un entorno matemático compatible.`);
  }
  try {
    const html = katex.renderToString(latex,{displayMode,throwOnError:true,trust:false,strict:'error',maxExpand:200,maxSize:20,output:'htmlAndMathml',macros:{}});
    return {latex,html};
  } catch(error) {
    const detail = error instanceof Error ? error.message.replace(/^KaTeX parse error:\s*/,'') : String(error);
    throw Error(`Revisa la fórmula: ${detail}`);
  }
}

export type FormulaValues = Record<string,string>;
export type FormulaTemplate = { id:string; name:string; category:string; sample:string; fields:{key:string;label:string;value:string}[]; build:(values:FormulaValues)=>string; block?:boolean };
const field = (key:string,label:string,value:string) => ({key,label,value});
export const formulaTemplates: FormulaTemplate[] = [
  {id:'fraction',name:'Fracción',category:'Básicas',sample:'\\frac{a}{b}',fields:[field('a','Numerador','a'),field('b','Denominador','b')],build:v=>`\\frac{${v.a}}{${v.b}}`},
  {id:'power',name:'Potencia',category:'Básicas',sample:'x^{n}',fields:[field('a','Base','x'),field('b','Exponente','n')],build:v=>`{${v.a}}^{${v.b}}`},
  {id:'subscript',name:'Subíndice',category:'Básicas',sample:'a_{n}',fields:[field('a','Expresión','a'),field('b','Índice','n')],build:v=>`{${v.a}}_{${v.b}}`},
  {id:'sqrt',name:'Raíz cuadrada',category:'Básicas',sample:'\\sqrt{x}',fields:[field('a','Dentro de la raíz','x')],build:v=>`\\sqrt{${v.a}}`},
  {id:'root',name:'Raíz n-ésima',category:'Básicas',sample:'\\sqrt[n]{x}',fields:[field('a','Dentro de la raíz','x'),field('b','Índice de la raíz','n')],build:v=>`\\sqrt[${v.b}]{${v.a}}`},
  {id:'equality',name:'Igualdad',category:'Básicas',sample:'a=b',fields:[field('a','Lado izquierdo','a'),field('b','Lado derecho','b')],build:v=>`${v.a}=${v.b}`},
  {id:'integral',name:'Integral definida',category:'Cálculo',sample:'\\int_a^b f(x)\\,dx',fields:[field('a','Límite inferior','0'),field('b','Límite superior','1'),field('f','Función','x^2'),field('x','Variable','x')],build:v=>`\\int_{${v.a}}^{${v.b}} ${v.f}\\,d${v.x}`,block:true},
  {id:'sum',name:'Sumatorio',category:'Cálculo',sample:'\\sum_{i=1}^{n}a_i',fields:[field('a','Inicio','i=1'),field('b','Final','n'),field('f','Término','a_i')],build:v=>`\\sum_{${v.a}}^{${v.b}} ${v.f}`,block:true},
  {id:'product',name:'Producto',category:'Cálculo',sample:'\\prod_{i=1}^{n}a_i',fields:[field('a','Inicio','i=1'),field('b','Final','n'),field('f','Factor','a_i')],build:v=>`\\prod_{${v.a}}^{${v.b}} ${v.f}`,block:true},
  {id:'limit',name:'Límite',category:'Cálculo',sample:'\\lim_{x\\to 0}f(x)',fields:[field('a','Variable','x'),field('b','Tiende a','0'),field('f','Expresión','\\frac{\\sin x}{x}')],build:v=>`\\lim_{${v.a}\\to ${v.b}} ${v.f}`,block:true},
  {id:'derivative',name:'Derivada',category:'Cálculo',sample:'\\frac{d}{dx}f(x)',fields:[field('a','Función','f(x)'),field('b','Variable','x')],build:v=>`\\frac{d}{d${v.b}}${v.a}`},
  {id:'partial',name:'Derivada parcial',category:'Cálculo',sample:'\\frac{\\partial f}{\\partial x}',fields:[field('a','Función','f'),field('b','Variable','x')],build:v=>`\\frac{\\partial ${v.a}}{\\partial ${v.b}}`},
  {id:'vector',name:'Vector',category:'Álgebra',sample:'\\vec{v}',fields:[field('a','Nombre del vector','v')],build:v=>`\\vec{${v.a}}`},
  {id:'binomial',name:'Coeficiente binomial',category:'Álgebra',sample:'\\binom{n}{k}',fields:[field('a','Total','n'),field('b','Selección','k')],build:v=>`\\binom{${v.a}}{${v.b}}`},
  {id:'matrix',name:'Matriz',category:'Álgebra',sample:'\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}',fields:[],build:v=>`\\begin{${v.delimiter||'pmatrix'}}${Array.from({length:Math.min(5,Math.max(1,Number(v.rows)||2))},(_,r)=>Array.from({length:Math.min(5,Math.max(1,Number(v.cols)||2))},(_,c)=>v[`m${r}_${c}`]||'0').join(' & ')).join(' \\\\ ')}\\end{${v.delimiter||'pmatrix'}}`,block:true},
  {id:'system',name:'Sistema de ecuaciones',category:'Álgebra',sample:'\\begin{cases}x+y=3\\\\x-y=1\\end{cases}',fields:[field('a','Primera ecuación','x+y=3'),field('b','Segunda ecuación','x-y=1')],build:v=>`\\begin{cases}${v.a}\\\\${v.b}\\end{cases}`,block:true},
  {id:'cases',name:'Función por tramos',category:'Álgebra',sample:'\\begin{cases}x^2&x\\geq0\\\\-x&x<0\\end{cases}',fields:[field('a','Primera expresión','x^2'),field('b','Primera condición','x≥0'),field('c','Segunda expresión','-x'),field('d','Segunda condición','x<0')],build:v=>`\\begin{cases}${v.a}&${v.b}\\\\${v.c}&${v.d}\\end{cases}`,block:true},
  {id:'quadratic',name:'Fórmula cuadrática',category:'Ejemplos',sample:'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',fields:[field('a','Coeficiente a','a'),field('b','Coeficiente b','b'),field('c','Coeficiente c','c')],build:v=>`x=\\frac{-(${v.b})\\pm\\sqrt{(${v.b})^2-4(${v.a})(${v.c})}}{2(${v.a})}`,block:true},
  {id:'pythagoras',name:'Teorema de Pitágoras',category:'Ejemplos',sample:'a^2+b^2=c^2',fields:[field('a','Primer cateto','a'),field('b','Segundo cateto','b'),field('c','Hipotenusa','c')],build:v=>`{${v.a}}^2+{${v.b}}^2={${v.c}}^2`},
  {id:'expression',name:'Expresión libre',category:'Básicas',sample:'f(x)=x^2+1',fields:[field('a','Expresión','f(x)=x^2+1')],build:v=>v.a},
];
export function templateDefaults(template:FormulaTemplate):FormulaValues {
  if(template.id==='matrix')return {rows:'2',cols:'2',delimiter:'pmatrix',m0_0:'a',m0_1:'b',m1_0:'c',m1_1:'d'};
  return Object.fromEntries(template.fields.map(f=>[f.key,f.value]));
}
