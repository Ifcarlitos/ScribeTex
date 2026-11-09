import type { JSONContent } from '@tiptap/react';
import { validateMath } from './math';

export function escapeLatex(text: string): string {
  const escaped: Record<string, string> = { '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '$': '\\$', '&': '\\&', '#': '\\#', '%': '\\%', '_': '\\_', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}' };
  return text.replace(/[\\{}$&#%_~^]/g, char => escaped[char]);
}

type Asset = { name: string; data: number[] };
type Context = { assets: Asset[] };
function render(node: JSONContent, context: Context): string {
  const children = () => (node.content ?? []).map(child => render(child, context)).join('');
  switch (node.type) {
    case 'doc': return children();
    case 'text': {
      let text = escapeLatex(node.text ?? '');
      for (const mark of node.marks ?? []) {
        if (mark.type === 'textStyle') {
          const a = mark.attrs ?? {};
          const families: Record<string,string> = {serif:'rmfamily','sans-serif':'sffamily',monospace:'ttfamily'};
          if (a.fontFamily) {
            if(!families[a.fontFamily]) throw Error('Fuente no compatible con la exportación.');
            text = `{\\${families[a.fontFamily]} ${text}}`;
          }
          if (a.fontSize) {
            if(!/^(10|11|12|14|16|18|24|28|36)pt$/.test(a.fontSize)) throw Error('Tamaño de fuente no compatible.');
            const size = parseInt(a.fontSize); text = `{\\fontsize{${size}}{${size * 1.3}}\\selectfont ${text}}`;
          }
          if(a.color) {
            let color = String(a.color).replace('#','');
            const rgb = /^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/.exec(a.color);
            if(rgb) color = rgb.slice(1).map(n=>Math.min(255,Number(n)).toString(16).padStart(2,'0')).join('');
            if(!/^[0-9a-f]{6}$/i.test(color)) throw Error('Color no compatible.');
            text = `\\textcolor[HTML]{${color}}{${text}}`;
          }
          continue;
        }
        const command: Record<string, string> = { bold: 'textbf', italic: 'textit', underline: 'uline', strike: 'sout', code: 'texttt' };
        if (!command[mark.type]) throw new Error(`Formato todavía no exportable: ${mark.type}`);
        text = `\\${command[mark.type]}{${text}}`;
      }
      return text;
    }
    case 'paragraph': {
      const alignment: Record<string,string> = {left:'raggedright',center:'centering',right:'raggedleft',justify:'justifying'};
      const value = children();
      const align = node.attrs?.textAlign;
      if(align && alignment[align]) return `{\\${alignment[align]} ${value}\\par}\n\n`;
      return `${value}\n\n`;
    }
    case 'heading': {
      const commands = ['section', 'subsection', 'subsubsection', 'paragraph', 'subparagraph', 'subparagraph'];
      return `\\${commands[(node.attrs?.level ?? 1) - 1]}*{${children()}}\n\n`;
    }
    case 'bulletList': return `\\begin{itemize}\n${children()}\\end{itemize}\n`;
    case 'orderedList': {
      const start = Number(node.attrs?.start ?? 1);
      return `\\begin{enumerate}[start=${start}]\n${children()}\\end{enumerate}\n`;
    }
    case 'listItem': return `\\item ${children()}\n`;
    case 'hardBreak': return '\\newline{}\n';
    case 'horizontalRule': return '\\par\\noindent\\rule{\\linewidth}{0.4pt}\n';
    case 'blockquote': return `\\begin{quote}\n${children()}\\end{quote}\n`;
    case 'codeBlock': return `\\begin{quote}\\ttfamily\n${escapeLatex((node.content ?? []).map(n => n.text ?? '').join('')).replace(/\n/g, '\\newline{}\n')}\n\\end{quote}\n`;
    case 'table': {
      const rows = node.content ?? [];
      const cols = rows[0]?.content?.length ?? 1;
      if (rows.some(row => row.content?.length !== cols || row.content.some(cell => (cell.attrs?.colspan ?? 1) !== 1 || (cell.attrs?.rowspan ?? 1) !== 1))) {
        throw new Error('Las tablas con celdas combinadas todavía no se pueden exportar.');
      }
      return `\\begin{longtable}{|${Array(cols).fill(`p{${(0.85 / cols).toFixed(4)}\\linewidth}`).join('|')}|}\n\\hline\n${children()}\\end{longtable}\n`;
    }
    case 'tableRow': return `${(node.content ?? []).map(child => render(child, context)).join(' & ')} \\\\\n\\hline\n`;
    case 'tableCell': case 'tableHeader': return children().trim();
    case 'image': {
      const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(String(node.attrs?.src));
      if(!match) throw Error('Solo se exportan imágenes PNG/JPEG insertadas desde el equipo.');
      const name = `image-${context.assets.length}.${match[1]==='png'?'png':'jpg'}`;
      const data = Array.from(atob(match[2]), c=>c.charCodeAt(0));
      context.assets.push({name,data});
      return `\\par\\noindent\\includegraphics[width=0.9\\linewidth,height=0.7\\textheight,keepaspectratio]{${name}}\\par\n`;
    }
    case 'inlineMath': case 'blockMath': {
      let latex: string;
      try {latex = validateMath(String(node.attrs?.latex ?? ''),node.type==='blockMath').latex;}
      catch(error){throw Error(`Revisa la ecuación antes de exportar. ${error instanceof Error?error.message:String(error)}`);}
      return node.type === 'inlineMath' ? `\\(${latex}\\)` : `\\[${latex}\\]\n`;
    }
    default: throw new Error(`Contenido todavía no exportable: ${node.type}`);
  }
}

export function toLatexProject(document: JSONContent, options: {margin?:number} = {}): {latex:string;assets:Asset[]} {
  const context:Context = {assets:[]};
  const margin = [15,25,30].includes(options.margin ?? 25) ? options.margin ?? 25 : 25;
  const body = render(document,context);
  const latex = '\\documentclass[12pt,a4paper]{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage[T1]{fontenc}\n\\usepackage[spanish]{babel}\n' + `\\usepackage[margin=${margin}mm]{geometry}\n` + '\\usepackage[normalem]{ulem}\n\\usepackage{longtable}\n\\usepackage{enumitem}\n\\usepackage{graphicx}\n\\usepackage{xcolor}\n\\usepackage{ragged2e}\n\\usepackage{amsmath,amssymb}\n\\begin{document}\n' + body + '\\end{document}\n';
  return {latex,assets:context.assets};
}
export function toLatex(document: JSONContent, options: {margin?:number} = {}): string {
  const project = toLatexProject(document,options);
  if(project.assets.length)throw Error('El documento contiene imágenes. Usa la vista previa PDF para exportarlas junto al texto.');
  return project.latex;
}
