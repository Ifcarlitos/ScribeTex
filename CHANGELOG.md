# Historial de cambios

## 0.2.0 — 2026-11-09

- Galería de 20 estructuras matemáticas y búsqueda por nombre.
- Composición visual de matrices hasta 5 × 5, integrales, límites, sumatorios, derivadas, sistemas y funciones por tramos.
- Entrada de LaTeX matemático, símbolos y previsualización en directo.
- Edición de fórmulas existentes y cambio entre formato en línea y bloque.
- Atajos para insertar, editar y guardar fórmulas.
- Validación compartida entre la previsualización y la exportación PDF.
- 33 pruebas y documento PDF con las nuevas estructuras.
- Preparación del repositorio para compartir: licencia MIT, guías, hoja de ruta, seguridad y plantillas de colaboración. Publicación pública pendiente de la revisión del autor.

## 0.1.0 — 2026-11-09

Primera versión alpha de ScribeTex.

### Incluido

- Editor Tiptap con interfaz React, TypeScript y Tailwind CSS.
- Cinta por pestañas, formato de texto, estilos, listas, alineación y navegación.
- Imágenes PNG/JPEG, tablas y ecuaciones visuales básicas.
- Guardado, apertura y recuperación local de documentos `.scribetex`.
- Generación local de PDF mediante Tauri/Rust y Tectonic incluido.
- Visor PDF.js con navegación por páginas y descarga del PDF.
- Instaladores Windows x64, Linux x64 y macOS Intel/Apple Silicon.
- Pruebas del serializador, conversión con el motor y backend nativo en las cuatro variantes.

### Límites

El editor no pagina automáticamente. El primer PDF necesita Internet para obtener recursos LaTeX. Los instaladores no están firmados ni notarizados. La interfaz de Linux y macOS no se ha revisado manualmente. Consulta el README para las funciones y restricciones de esta versión.
