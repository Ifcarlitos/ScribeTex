import { useState } from 'react';
import type { Editor } from '@tiptap/react';

export function MathDialog({editor,onClose}: {editor:Editor;onClose:()=>void}) {
  const [kind,setKind] = useState('fraction');
  const [a,setA] = useState('a');
  const [b,setB] = useState('b');
  const [error,setError] = useState('');
  function insert() {
    if (![a,b].every(v => /^[a-zA-Z0-9 +\-=().,]*$/.test(v)) || !a.trim()) {setError('Usa letras, números y operadores sencillos.');return;}
    const latex = kind === 'fraction' ? `\\frac{${a}}{${b || '1'}}` : kind === 'power' ? `{${a}}^{${b || '2'}}` : kind === 'sqrt' ? `\\sqrt{${a}}` : `${a}=${b}`;
    editor.chain().focus().insertInlineMath({latex}).run(); onClose();
  }
  return <div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="math-title" className="dialog" onKeyDown={e => {if(e.key === 'Escape')onClose();}}><header><h2 id="math-title">Insertar ecuación</h2><button aria-label="Cerrar ecuación" onClick={onClose}>×</button></header><p>Elige una estructura y completa sus valores.</p><div className="equation-choices">{[['fraction','a / b'],['power','aᵇ'],['sqrt','√a'],['equality','a = b']].map(([id,label]) => <button key={id} aria-pressed={kind===id} onClick={()=>setKind(id)}>{label}</button>)}</div><label>{kind==='fraction'?'Numerador':kind==='power'?'Base':'Expresión'}<input autoFocus value={a} onChange={e=>setA(e.target.value)} /></label>{kind!=='sqrt'&&<label>{kind==='fraction'?'Denominador':kind==='power'?'Exponente':'Resultado'}<input value={b} onChange={e=>setB(e.target.value)} /></label>}<p role="alert">{error}</p><button className="primary-button" onClick={insert}>Insertar</button></section></div>;
}
