import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import Mathematics from '@tiptap/extension-mathematics';
import { invoke, isTauri } from '@tauri-apps/api/core';
import 'katex/dist/katex.min.css';
import { Ribbon } from './Ribbon';
import { MathDialog } from './MathDialog';
import { toLatex, toLatexProject } from '../lib/latex';

const draftKey = 'scribetex-draft-v1';
const PdfPreview = lazy(() => import('./PdfPreview'));
function download(data: Blob, name: string) { const url=URL.createObjectURL(data); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
export function DocumentEditor() {
  const [message,setMessage]=useState('Listo');
  const [title,setTitle]=useState('Documento sin título');
  const [margin,setMargin]=useState(25);
  const [zoom,setZoom]=useState(100);
  const [outline,setOutline]=useState(false);
  const [math,setMath]=useState(false);
  const [busy,setBusy]=useState(false);
  const [pdf,setPdf]=useState<string|null>(null);
  const imageInput=useRef<HTMLInputElement>(null);
  const fileInput=useRef<HTMLInputElement>(null);
  const editor=useEditor({extensions:[StarterKit.configure({link:false}),Image.configure({allowBase64:true}),TableKit,TextAlign.configure({types:['heading','paragraph']}),TextStyleKit.configure({backgroundColor:false,lineHeight:false}),Mathematics.configure({katexOptions:{throwOnError:false,trust:false}})], content:'<p></p>',editorProps:{attributes:{'aria-label':'Contenido del documento',spellcheck:'true'}}});
  const state=useEditorState({editor,selector:({editor:e})=>{ const headings:{text:string;pos:number;level:number}[]=[];e?.state.doc.descendants((node,pos)=>{if(node.type.name==='heading')headings.push({text:node.textContent,pos,level:node.attrs.level});});return {words:e?.getText().trim().split(/\s+/).filter(Boolean).length??0,headings}; }});
  useEffect(()=>{
    if(!editor)return;
    try { const raw=localStorage.getItem(draftKey);if(raw){const data=JSON.parse(raw);editor.commands.setContent(data.content,{errorOnInvalidContent:true});setTitle(data.title||'Documento recuperado');setMargin([15,25,30].includes(data.margin)?data.margin:25);} }catch{setMessage('No se pudo recuperar el borrador anterior.');}
  },[editor]);
  useEffect(()=>{
    if(!editor)return;
    let timer:ReturnType<typeof setTimeout>;
    const save=()=>{clearTimeout(timer);timer=setTimeout(()=>{try{localStorage.setItem(draftKey,JSON.stringify({version:1,title,margin,content:editor.getJSON()}));setMessage('Borrador guardado en este equipo');}catch{setMessage('No hay espacio para el borrador. Guarda una copia del documento.');}},700);};
    editor.on('update',save);save();return()=>{clearTimeout(timer);editor.off('update',save);};
  },[editor,title,margin]);
  useEffect(()=>()=>{if(pdf)URL.revokeObjectURL(pdf);},[pdf]);
  function save(){if(editor){download(new Blob([JSON.stringify({version:1,title,margin,content:editor.getJSON()})],{type:'application/json'}),`${title.replace(/[^\p{L}\p{N} _-]/gu,'_')}.scribetex`);setMessage('Copia del documento guardada.');}}
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();save();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
  async function open(file?:File){if(!file||!editor)return;try{if(file.size>25*1024*1024)throw Error('El documento supera 25 MB.');const d=JSON.parse(await file.text());if(d.version!==1||d.content?.type!=='doc')throw Error('Formato de documento no reconocido.');editor.commands.setContent(d.content,{errorOnInvalidContent:true});setTitle(typeof d.title==='string'?d.title:'Documento');setMargin([15,25,30].includes(d.margin)?d.margin:25);setMessage('Documento abierto.');}catch(error){setMessage(String(error));}}
  async function insertImage(file?:File){if(!file||!editor)return;if(!['image/png','image/jpeg'].includes(file.type)||file.size>5*1024*1024){setMessage('Elige una imagen PNG o JPEG de hasta 5 MB.');return;}try{const src=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(Error('No se pudo leer la imagen.'));r.readAsDataURL(file);});editor.chain().focus().setImage({src,alt:file.name}).run();}catch(error){setMessage(String(error));}}
  function tex(){if(!editor)return;try{download(new Blob([toLatex(editor.getJSON(),{margin})],{type:'application/x-tex'}),'documento.tex');setMessage('LaTeX exportado.');}catch(error){setMessage(String(error));}}
  async function preview(){if(!editor||busy)return;if(!isTauri()){setMessage('Abre la aplicación de escritorio para generar PDF con Tectonic o MiKTeX/TeX Live.');return;}setBusy(true);setMessage('Generando PDF…');try{const project=toLatexProject(editor.getJSON(),{margin});const bytes=await invoke<number[]>('compile_pdf',project);setPdf(URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'})));setMessage('PDF generado.');}catch(error){setMessage(String(error));}finally{setBusy(false);}}
  return <div className="word-app">
    <header className="titlebar"><span className="brand">S</span><button aria-label="Guardar documento" title="Guardar (Ctrl+S)" onClick={save}>▣</button><span className="title-divider"/><input aria-label="Nombre del documento" value={title} onChange={event=>setTitle(event.target.value)}/><span className="app-name">ScribeTex</span><button className="pdf-button" onClick={()=>void preview()} disabled={busy}>{busy?'Generando…':'Vista previa PDF'}</button></header>
    {editor&&<Ribbon editor={editor} onImage={()=>imageInput.current?.click()} onMath={()=>setMath(true)} onSave={save} onOpen={()=>fileInput.current?.click()} onNew={()=>{save();editor.commands.setContent('<p></p>');setTitle('Documento sin título');setMessage('Documento nuevo. Se descargó una copia del anterior.');}} onPdf={()=>void preview()} onTex={tex} busy={busy} margin={margin} onMargin={setMargin} outline={outline} onOutline={()=>setOutline(!outline)} zoom={zoom} onZoom={setZoom}/>}
    <input ref={imageInput} hidden type="file" accept="image/png,image/jpeg" onChange={event=>{void insertImage(event.target.files?.[0]);event.target.value='';}}/>
    <input ref={fileInput} hidden type="file" accept=".scribetex,application/json" onChange={event=>{void open(event.target.files?.[0]);event.target.value='';}}/>
    <div className="workspace">{outline&&<aside className="navigation"><h2>Navegación</h2><p>Títulos del documento</p>{state?.headings.length?state.headings.map(h=><button key={h.pos} style={{paddingLeft:h.level*10}} onClick={()=>editor?.chain().focus().setTextSelection(h.pos+1).scrollIntoView().run()}>{h.text||'Sin título'}</button>):<p>Aplica un estilo de título para verlo aquí.</p>}</aside>}
    <main className="document-canvas"><div className="page-stage" style={{zoom:zoom/100} as CSSProperties}><div className="ruler" aria-hidden="true">{Array.from({length:21},(_,i)=><span key={i}>{i||''}</span>)}</div><div className="paper" style={{padding:`${margin}mm`}}><EditorContent editor={editor}/></div></div></main></div>
    <footer className="statusbar"><span role="status">{message}</span><span>{state?.words??0} palabras</span><span>Español</span><span className="status-spacer"/><button onClick={()=>setOutline(!outline)} aria-pressed={outline}>☷ Navegación</button><label>Zoom <input aria-label="Zoom del documento" type="range" min="50" max="150" step="10" value={zoom} onChange={event=>setZoom(Number(event.target.value))}/></label><span>{zoom}%</span></footer>
    {math&&editor&&<MathDialog editor={editor} onClose={()=>setMath(false)}/>}
    {pdf&&<Suspense fallback={<div className="modal-backdrop"><p>Cargando visor PDF…</p></div>}><PdfPreview url={pdf} onClose={()=>setPdf(null)}/></Suspense>}
  </div>;
}
