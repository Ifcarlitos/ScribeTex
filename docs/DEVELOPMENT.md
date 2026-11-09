# Desarrollo de ScribeTex

## Requisitos

- Node.js 22 LTS (22.12 o superior), npm y Rust estable 1.90 o superior. La compilación de referencia utilizó Rust 1.99.
- Windows: Microsoft C++ Build Tools con desarrollo de escritorio C++ y Windows SDK; WebView2.
- Linux: herramientas de compilación, WebKitGTK 4.1 y las bibliotecas indicadas abajo.
- macOS: Xcode Command Line Tools.

Consulta los [requisitos oficiales de Tauri](https://v2.tauri.app/start/prerequisites/) para tu distribución. Estos requisitos son para contribuir y compilar; los usuarios de los instaladores no necesitan Node.js, Rust ni una instalación de LaTeX.

En Debian/Ubuntu, el flujo de compilación utiliza:

```sh
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev librsvg2-dev libayatana-appindicator3-dev patchelf
```

## Preparar el código

```sh
git clone https://github.com/Ifcarlitos/ScribeTex.git
cd ScribeTex
npm ci
npm run dev
```

Vite sirve la interfaz en `http://localhost:1420`. Este modo no compila PDFs: esa operación pertenece al backend nativo.

## Preparar el motor incluido

Ejecuta **uno** de estos comandos, según el equipo en el que estés compilando:

```sh
# Windows x64
node .github/scripts/fetch-tectonic.mjs x86_64-pc-windows-msvc

# Linux x64
node .github/scripts/fetch-tectonic.mjs x86_64-unknown-linux-gnu

# macOS Apple Silicon
node .github/scripts/fetch-tectonic.mjs aarch64-apple-darwin

# macOS Intel
node .github/scripts/fetch-tectonic.mjs x86_64-apple-darwin
```

El script descarga Tectonic 0.17.0 desde su release oficial, verifica un SHA-256 fijado y genera los recursos y la configuración local. No subas `src-tauri/engines` ni `tauri.engine.conf.json` al repositorio. Al cambiar de plataforma, prepara de nuevo el motor apropiado.

```sh
npm run tauri dev -- --config src-tauri/tauri.engine.conf.json
```

También puedes usar un Tectonic o `pdflatex` existente en el PATH para desarrollo; los instaladores publicados incluyen el motor.

## Pruebas

```sh
npm test
npm run build
npx tsx .github/scripts/smoke-pdf.ts
cargo test --release --manifest-path src-tauri/Cargo.toml -- --ignored
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
```

La prueba PDF genera `src-tauri/target/pdf-smoke/sample.pdf` usando el serializador real. La prueba Rust utiliza ese documento y sus imágenes y guarda `backend.pdf` junto a él. La primera conversión descarga recursos y puede tardar varios minutos. Para reutilizar la caché de la prueba al ejecutar Rust:

```powershell
# PowerShell
$env:TECTONIC_CACHE_DIR = Join-Path (Get-Location) 'src-tauri/target/tectonic-cache'
```

```sh
# Bash / zsh
export TECTONIC_CACHE_DIR="$PWD/src-tauri/target/tectonic-cache"
```

Ejecuta la prueba Rust después de establecer esa variable si quieres evitar otra descarga inicial.

## Crear instaladores

Prepara primero el motor correspondiente. Después ejecuta en cada sistema:

```sh
# Windows
npm run tauri build -- --bundles nsis --config src-tauri/tauri.engine.conf.json

# Linux
npm run tauri build -- --bundles deb,appimage --config src-tauri/tauri.engine.conf.json

# macOS
npm run tauri build -- --bundles dmg --config src-tauri/tauri.engine.conf.json
```

Los paquetes aparecen en `src-tauri/target/release/bundle/`. Si usas `--target`, aparecen bajo `src-tauri/target/<target>/release/bundle/`. El flujo de GitHub Actions realiza las pruebas y genera los paquetes en Windows, Linux y macOS nativos. Guarda sus resultados como artefactos; no publica automáticamente una release.

## Publicar descargas en Releases

En GitHub, abre **Actions → Publish installers → Run workflow** e introduce el ID de una ejecución correcta de **Desktop installers** sobre `main`. El flujo recupera sus cuatro artefactos, exige los cinco instaladores de la versión correspondiente y genera `SHA256SUMS.txt`. Publica una versión preliminar con descargas directas que no requieren iniciar sesión.

La etiqueta apunta al commit que generó los instaladores. El flujo rechaza compilaciones fallidas, ramas distintas de `main` y la sustitución de una release ya publicada. Si una carga se interrumpe antes de publicar, puede reanudarse sobre el borrador. Las pruebas y los instaladores deben volver a generarse al cambiar la aplicación; no se reutilizan artefactos de otra versión.

Después de publicar, actualiza los enlaces de descarga del README. Los errores históricos de Actions se conservan como registro: consulta la ejecución más reciente y su commit al diagnosticar una notificación antigua.

## Estructura

```text
src/components/       Editor, cinta, ecuaciones y visor PDF
src/lib/              Serializador LaTeX y pruebas
src-tauri/src/         Aplicación nativa y compilador PDF
src-tauri/icons/       Identidad visual propia
.github/scripts/      Motor verificado y documento de prueba
.github/workflows/    Compilaciones por plataforma
docs/                 Documentación y recursos públicos
```

## Seguridad y límites del backend

El backend utiliza un directorio temporal distinto por trabajo, argumentos de proceso fijos, el modo no confiable de Tectonic y límites de tiempo/tamaño. No interpola el documento en un comando del shell. Estas medidas no equivalen a un aislamiento completo del sistema operativo.

Los cambios en nodos o marcas del editor deben acompañarse de soporte en el serializador o de un error explícito. No omitas contenido silenciosamente durante la exportación.