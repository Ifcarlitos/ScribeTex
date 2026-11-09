import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfPreview({ url, onClose }: { url: string; onClose: () => void }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const loading = getDocument({ url, isEvalSupported: false });
    let active = true;
    loading.promise.then(pdf => { if (active) setDocument(pdf); }).catch(reason => { if(active) setError(String(reason)); });
    return () => { active = false; void loading.destroy(); };
  }, [url]);
  useEffect(() => {
    if (!document || !canvas.current) return;
    let active = true;
    let render: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined;
    document.getPage(page).then(pdfPage => {
      if(!active || !canvas.current) return;
      const viewport = pdfPage.getViewport({ scale: 1.4 });
      const target = canvas.current;
      target.width = viewport.width; target.height = viewport.height;
      render = pdfPage.render({ canvasContext: target.getContext('2d')!, viewport });
      render.promise.catch(reason => { if(active) setError(String(reason)); });
    }).catch(reason => { if(active) setError(String(reason)); });
    return () => { active = false; render?.cancel(); };
  }, [document, page]);
  return <div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-label="Vista previa PDF" className="pdf-dialog" onKeyDown={event => {if(event.key==='Escape')onClose();}}>
    <header><h2>Vista previa del documento</h2><button disabled={page<=1} onClick={()=>setPage(page-1)} aria-label="Página anterior">‹</button><span>{page} / {document?.numPages ?? '…'}</span><button disabled={!document || page>=document.numPages} onClick={()=>setPage(page+1)} aria-label="Página siguiente">›</button><a href={url} download="documento.pdf">Guardar PDF</a><button aria-label="Cerrar vista previa" onClick={onClose}>×</button></header>
    <div className="pdf-pages">{error ? <p role="alert">No se pudo mostrar el PDF: {error}. Puedes guardarlo con el enlace superior.</p> : <canvas aria-label={`Página ${page} del PDF`} ref={canvas}/>}</div>
  </section></div>;
}
