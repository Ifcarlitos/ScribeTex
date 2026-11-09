# ScribeTex

Editor visual de escritorio sobre React + TypeScript + Tailwind CSS, Tiptap 3 y Tauri 2 (Rust).
Repositorio: https://github.com/Ifcarlitos/ScribeTex

## Inicio desde este repositorio

Requisitos: Node.js 22 LTS o superior compatible, npm, Rust 1.90 o superior, Microsoft C++ Build Tools (desarrollo de escritorio con C++) y WebView2 para Windows.

```powershell
git clone https://github.com/Ifcarlitos/ScribeTex.git
cd ScribeTex
npm install
npm run dev
```

Abrir http://localhost:1420 para el modo navegador. Para la aplicación de escritorio:

```powershell
npm run tauri dev
```

Si Rust está desactualizado, ejecutar `rustup update stable` antes de iniciar Tauri. El equipo de desarrollo ya se ha actualizado a Rust 1.99. El frontend y sus pruebas se han comprobado; también se ha generado un PDF real de 15.402 bytes mediante el serializador y Tectonic incluido. La verificación de instaladores nativos sigue en curso.

Validación y ejecutable:

```powershell
npm test
npm run build
npm run tauri build
```

El empaquetado nativo está activado. Los paquetes se generan bajo `src-tauri/target/release/bundle/`. Windows utiliza WebView2; si falta, el instalador descarga su bootstrapper. Para incluir el motor LaTeX, preparar primero el recurso oficial y utilizar la configuración adicional:

```powershell
node .github/scripts/fetch-tectonic.mjs x86_64-pc-windows-msvc
npm run tauri build -- --bundles nsis --config src-tauri/tauri.engine.conf.json
```

El mismo script admite `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin` y `x86_64-apple-darwin`. Para desarrollo con el motor preparado: `npm run tauri dev -- --config src-tauri/tauri.engine.conf.json`.

## Instalación rápida en Windows, Linux y macOS

La configuración de distribución conserva Tauri para aprovechar el visor web del sistema y evitar incluir un navegador completo. No se promete un tamaño ni un tiempo de instalación hasta medir los artefactos reales.

| Plataforma | Paquete previsto | Instalación |
| --- | --- | --- |
| Windows x64 | NSIS `-setup.exe` | Instalación por usuario; WebView2 se descarga solo si es necesario |
| Linux x64 | `.deb` y `.AppImage` | Paquete para Debian/Ubuntu o archivo ejecutable AppImage |
| macOS Apple Silicon | `.dmg` ARM64 | Arrastrar la aplicación a Aplicaciones |
| macOS Intel | `.dmg` x64 | Arrastrar la aplicación a Aplicaciones |

El flujo `.github/workflows/desktop-build.yml` prepara compilaciones en cada sistema mediante ejecución manual, cambios en `main`, etiquetas `v*` o cambios de una pull request. Cada plataforma genera primero un PDF de prueba con título, español, formatos de texto, ecuación, tabla e imagen usando el serializador real y el motor incluido. Después ejecuta la prueba de integración Rust y construye el instalador. Guarda instaladores y documentos de prueba como artefactos de GitHub Actions; no publica una release. Los paquetes están pendientes de verificación en sus sistemas de destino y todavía no están firmados ni notarizados.

### Motor LaTeX incluido sin instalar TeX Live completo

La compilación de instaladores incorpora **Tectonic 0.17.0**, con un binario oficial específico por plataforma. El script fija la versión y verifica el archivo descargado contra SHA-256 guardados en el repositorio y obtenidos de los digests de la release oficial. Si la descarga falla o cambia el hash, no genera el instalador. Linux emplea el binario musl para reducir dependencias compartidas. El motor queda en los recursos de la aplicación, bajo `engines/tectonic` o `engines/tectonic.exe`, junto a su licencia y procedencia.

Los usuarios de los instaladores no necesitan instalar MiKTeX, TeX Live, Rust ni Node.js. Tectonic obtiene los recursos LaTeX que necesita por Internet durante la primera compilación y los conserva en caché; ese primer PDF necesita conexión y su duración depende de las descargas. El uso sin conexión desde la primera ejecución requeriría distribuir una caché ampliada, todavía no preparada. El motor aumenta la descarga de la aplicación; el tamaño final se medirá cuando se ejecuten las compilaciones de instaladores. MiKTeX/TeX Live quedan como alternativas para desarrollo.

Referencias oficiales: [distribución Tauri](https://v2.tauri.app/distribute/), [instaladores Windows](https://v2.tauri.app/distribute/windows-installer/), [compilación con GitHub Actions](https://v2.tauri.app/distribute/pipelines/github/), [instalación Tectonic](https://tectonic-typesetting.github.io/book/latest/installation/) y [descarga y caché de recursos](https://tectonic-typesetting.github.io/book/latest/getting-started/first-document.html).

## Inicializar un proyecto equivalente desde cero

No ejecutar estos comandos encima de este repositorio ya preparado:

```powershell
npm create tauri-app@latest scribetex -- --template react-ts --manager npm
cd scribetex
npm install
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-table
npm install -D tailwindcss @tailwindcss/vite
```

Registrar `tailwindcss()` en la configuración de Vite e importar `@import "tailwindcss";` en la hoja de estilos, como en este proyecto.

## Estructura

```text
src/
  App.tsx                       Entrada de la aplicación
  main.tsx                      Montaje React
  styles.css                    Tailwind y estilos del documento
  components/
    DocumentEditor.tsx          Estado Tiptap, imágenes y exportación
    Ribbon.tsx                  Formato, listas y tablas
    PdfPreview.tsx              Previsualización PDF mediante canvas
  lib/
    latex.ts                    Serializador JSON Tiptap → LaTeX
    latex.test.ts               Pruebas de transformación
src-tauri/
  src/main.rs                   Aplicación nativa
  src/pdf.rs                    Compilación asíncrona y recursos temporales
  Cargo.toml                    Dependencias Rust
  build.rs
  tauri.conf.json               Ventana y configuración de compilación
```

## Funciones implementadas y límites

Editor visual con cinta de herramientas por pestañas, estilos, tamaños y colores de texto, alineación, listas, historial, imágenes locales PNG/JPEG y tablas. Incluye guardado y apertura de documentos editables, recuperación local y estructuras matemáticas visuales básicas. Tiptap proporciona atajos de teclado como Ctrl+B, Ctrl+I y Ctrl+Z. La experiencia está inspirada en un procesador de textos de escritorio; no replica todas las funciones de Microsoft Word.

El serializador genera LaTeX con escape de caracteres reservados, formatos, títulos, listas, tablas simples, ecuaciones e imágenes como recursos. Los nodos no soportados producen un aviso, evitando pérdida silenciosa. La exportación `.tex` individual requiere un documento sin imágenes; la generación PDF entrega las imágenes junto a su documento al backend.

La aplicación de escritorio llama a un comando Rust asíncrono que compila en un directorio temporal por trabajo usando el motor incluido, argumentos fijos y límites de ejecución. El PDF se previsualiza dentro de la aplicación con PDF.js y canvas, sin depender de que el visor web del sistema tenga un lector PDF. El modo navegador permite editar, pero la compilación requiere la aplicación nativa.

Validación disponible: `npm test`, `npm run build` y `npx tsx .github/scripts/smoke-pdf.ts` (este último requiere preparar el motor y puede descargar recursos LaTeX). La prueba nativa de integración se ejecuta con `cargo test --release --manifest-path src-tauri/Cargo.toml -- --ignored` después de generar el documento de prueba. Los resultados de instaladores se registrarán tras finalizar las compilaciones.

La hoja A4 del editor es una aproximación visual continua, sin paginación automática. LaTeX determinará los saltos de página del PDF final. El usuario edita contenido visual; no necesita ver código LaTeX.
