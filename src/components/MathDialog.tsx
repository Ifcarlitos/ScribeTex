import { useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { formulaTemplates, templateDefaults, validateMath, type FormulaValues } from '../lib/math';

export type MathTarget = { pos:number; type:'inlineMath'|'blockMath'; latex:string; templateId?:string|null; templateValues?:FormulaValues|null };

export function MathDialog({editor,target,onClose}:{editor:Editor;target?:MathTarget;onClose:()=>void}) {
  const original = formulaTemplates.find(t=>t.id===target?.templateId);
  const [mode,setMode]=useState<'guided'|'latex'>(target&&!original?'latex':'guided');
  const [templateId,setTemplateId]=useState(original?.id??'fraction');
  const [values,setValues]=useState<FormulaValues>(()=>({...templateDefaults(original??formulaTemplates[0]),...target?.templateValues}));
  const [code,setCode]=useState(target?.latex??'\\frac{a}{b}');
  const [block,setBlock]=useState(target?.type==='blockMath');
  const [search,setSearch]=useState('');
  const [saveError,setSaveError]=useState('');
  const [activeField,setActiveField]=useState('a');
  const fields=useRef<Record<string,HTMLInputElement|HTMLTextAreaElement|null>>({});
  const dialog=useRef<HTMLElement>(null);
  const template=formulaTemplates.find(t=>t.id===templateId)!;
  const source=mode==='latex'?code:template.build(values);
  const preview=useMemo(()=>{try{return {...validateMath(source,block),error:''};}catch(error){return {latex:'',html:'',error:error instanceof Error?error.message:String(error)};}},[source,block]);
  useEffect(()=>{const timer=setTimeout(()=>dialog.current?.querySelector<HTMLElement>('[data-first-field]')?.focus(),0);return()=>clearTimeout(timer);},[]);
  function selectTemplate(id:string){const next=formulaTemplates.find(t=>t.id===id)!;setTemplateId(id);setValues(templateDefaults(next));setMode('guided');setActiveField(next.fields[0]?.key??'m0_0');setBlock(!!next.block);setSaveError('');}
  function switchMode(next:'guided'|'latex'){
    if(next===mode)return;
    if(next==='latex')setCode(source);
    else if(code!==template.build(values)){setTemplateId('expression');setValues({a:code});setActiveField('a');}
    setMode(next);setSaveError('');
  }
  function insertSymbol(value:string){const key=mode==='latex'?'code':activeField;const input=fields.current[key];if(!input)return;const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;const selected=input.value.slice(start,end);const insertion=selected&&value.includes('{}')?value.replace('{}',`{${selected}}`):value;const empty=insertion.indexOf('{}');const caret=start+(empty<0?insertion.length:empty+1);const next=input.value.slice(0,start)+insertion+input.value.slice(end);if(mode==='latex')setCode(next);else setValues(previous=>({...previous,[key]:next}));requestAnimationFrame(()=>{input.focus();input.setSelectionRange(caret,caret);});}
  function save(){
    if(preview.error)return;
    const type=block?'blockMath':'inlineMath';
    const attrs={latex:preview.latex,templateId:mode==='guided'?templateId:null,templateValues:mode==='guided'?values:null};
    if(target){
      const current=editor.state.doc.nodeAt(target.pos);
      if(current?.type.name!==target.type||current.attrs.latex!==target.latex){setSaveError('La fórmula ha cambiado. Cierra esta ventana y vuelve a abrirla.');return;}
      if(target.type===type){editor.chain().focus().setNodeSelection(target.pos).updateAttributes(type,attrs).run();}
      else editor.chain().focus().setNodeSelection(target.pos).deleteSelection().insertContent({type,attrs}).run();
    }else editor.chain().focus().insertContent({type,attrs}).run();
    onClose();
  }
  const number=(key:string)=>Math.min(5,Math.max(1,Number(values[key])||2));
  const field=(key:string,label:string,auto=false)=><label key={key}>{label}<input data-first-field={auto||undefined} aria-label={label} ref={element=>{fields.current[key]=element;}} value={values[key]??''} onFocus={event=>{setActiveField(key);event.currentTarget.select();}} onChange={event=>{setValues(previous=>({...previous,[key]:event.target.value}));setSaveError('');}} maxLength={3000}/></label>;
  return <div className="modal-backdrop"><section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="math-title" className="dialog math-dialog" onKeyDown={event=>{
    if(event.key==='Escape'){event.preventDefault();onClose();}
    if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();save();}
    if(event.key==='Tab'){const nodes=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,[tabindex="0"]')??[]);const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  }}>
    <header><div><h2 id="math-title">{target?'Editar fórmula':'Insertar fórmula'}</h2><p>Compón una estructura o pega una expresión LaTeX.</p></div><button aria-label="Cerrar editor de fórmulas" onClick={onClose}>×</button></header>
    <div className="math-layout">
      <aside className="formula-gallery"><label>Buscar una estructura<input aria-label="Buscar fórmula" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Integral, matriz, raíz…"/></label>
      {['Básicas','Cálculo','Álgebra','Ejemplos'].map(category=>{const matches=formulaTemplates.filter(t=>t.category===category&&t.name.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')));return matches.length>0&&<div key={category}><h3>{category}</h3>{matches.map(t=><button key={t.id} className="formula-choice" aria-pressed={mode==='guided'&&templateId===t.id} onClick={()=>selectTemplate(t.id)}><span aria-hidden="true" dangerouslySetInnerHTML={{__html:validateMath(t.sample,false).html}}/><span>{t.name}</span></button>)}</div>;})}
      {!formulaTemplates.some(t=>t.name.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')))&&<p>No hay estructuras con ese nombre.</p>}</aside>
      <div className="math-pane"><div className="math-composer"><div className="math-mode" role="group" aria-label="Modo de edición"><button aria-pressed={mode==='guided'} onClick={()=>switchMode('guided')}>Composición visual</button><button aria-pressed={mode==='latex'} onClick={()=>switchMode('latex')}>Código LaTeX</button></div>
      {mode==='guided'?<><h3>{template.name}</h3><div className="formula-fields">{template.fields.map((f,i)=>field(f.key,f.label,i===0))}</div>{template.id==='matrix'&&<><div className="matrix-controls"><label>Filas<select aria-label="Filas de la matriz" value={number('rows')} onChange={event=>setValues(v=>({...v,rows:event.target.value}))}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label><label>Columnas<select aria-label="Columnas de la matriz" value={number('cols')} onChange={event=>setValues(v=>({...v,cols:event.target.value}))}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label><label>Delimitadores<select aria-label="Delimitadores de la matriz" value={values.delimiter||'pmatrix'} onChange={event=>setValues(v=>({...v,delimiter:event.target.value}))}><option value="pmatrix">Paréntesis ( )</option><option value="bmatrix">Corchetes [ ]</option><option value="vmatrix">Determinante | |</option><option value="matrix">Sin delimitadores</option></select></label></div><div className="matrix-grid" style={{gridTemplateColumns:`repeat(${number('cols')}, minmax(0,1fr))`}}>{Array.from({length:number('rows')},(_,r)=>Array.from({length:number('cols')},(_,c)=>field(`m${r}_${c}`,`Fila ${r+1}, columna ${c+1}`,r===0&&c===0)))}</div></>}
      <p className="field-help">Usa los símbolos de abajo. También puedes escribir x^2, a_n o anidar expresiones como fracciones.</p></>:<><label className="latex-label">Expresión matemática LaTeX<textarea data-first-field ref={element=>{fields.current.code=element;}} aria-label="Código LaTeX de la fórmula" value={code} onChange={event=>{setCode(event.target.value);setSaveError('');}} spellCheck={false} rows={6} maxLength={12000} placeholder="\frac{a}{b}"/></label><p className="field-help">Acepta fórmulas, matrices, sistemas y alineación matemática. No admite documentos completos, paquetes ni comandos que lean archivos. Puedes pegar con delimitadores $…$ o \[ … \].</p><div className="math-snippets">{[['Fracción','\\frac{}{}'],['Raíz','\\sqrt{}'],['Índice','_{}'],['Potencia','^{}'],['Texto','\\text{}']].map(([name,snippet])=><button key={name} onMouseDown={event=>event.preventDefault()} onClick={()=>insertSymbol(snippet)}>{name}</button>)}</div></>}
      <div className="math-symbols" role="group" aria-label="Símbolos matemáticos">{['α','β','θ','λ','μ','σ','π','∞','±','×','·','≤','≥','≠','≈','∈','→','∂','∇'].map(symbol=><button key={symbol} aria-label={`Insertar ${symbol}`} onMouseDown={event=>event.preventDefault()} onClick={()=>insertSymbol(symbol)}>{symbol}</button>)}</div>
      <fieldset className="formula-placement"><legend>Ubicación</legend><label><input type="radio" name="math-placement" checked={!block} onChange={()=>setBlock(false)}/>Dentro del texto</label><label><input type="radio" name="math-placement" checked={block} onChange={()=>setBlock(true)}/>En una línea aparte</label></fieldset>
      <section className="formula-preview" aria-label="Vista previa de la fórmula"><span>Vista previa</span>{preview.error?<p role="status" className="math-error">{preview.error}</p>:<div className="formula-render" dangerouslySetInnerHTML={{__html:preview.html}}/>}</section>
      {saveError&&<p role="alert" className="math-error">{saveError}</p>}
      </div>
      <footer className="math-actions"><span>Ctrl / ⌘ + Enter para guardar</span><button onClick={onClose}>Cancelar</button><button className="primary-button" disabled={!!preview.error} onClick={save}>{target?'Guardar cambios':'Insertar fórmula'}</button></footer>
      </div>
    </div>
  </section></div>;
}
