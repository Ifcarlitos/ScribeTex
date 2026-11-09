<div align="center">
  <img src="docs/assets/scribetex.png" alt="ScribeTex" width="88" height="88" />
  <h1>ScribeTex</h1>
  <p><strong>Escribe como en un procesador de textos. Exporta con la calidad de LaTeX.</strong></p>
  <p>A visual desktop editor powered by LaTeX, for Windows, Linux and macOS.</p>
  <p>
    <a href="https://github.com/Ifcarlitos/ScribeTex/actions/workflows/desktop-build.yml"><img src="https://github.com/Ifcarlitos/ScribeTex/actions/workflows/desktop-build.yml/badge.svg" alt="Compilación y pruebas" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Licencia MIT" /></a>
    <img src="https://img.shields.io/badge/status-alpha-orange.svg" alt="Versión inicial alpha" />
    <img src="https://img.shields.io/badge/platforms-Windows%20%7C%20Linux%20%7C%20macOS-235aa2.svg" alt="Windows, Linux y macOS" />
  </p>
  <p><a href="https://github.com/Ifcarlitos/ScribeTex/actions/workflows/desktop-build.yml">Descargar</a> · <a href="docs/DEVELOPMENT.md">Desarrollo</a> · <a href="CONTRIBUTING.md">Contribuir</a> · <a href="https://github.com/Ifcarlitos/ScribeTex/issues">Comunicar un problema</a></p>
</div>

## ¿Qué es ScribeTex?

ScribeTex es un editor visual de escritorio para crear documentos PDF con LaTeX sin escribir su código. Edita texto, aplica estilos e inserta tablas, imágenes y ecuaciones desde una interfaz familiar con cinta de herramientas.

La aplicación incluye **Tectonic**, un motor LaTeX que genera el PDF en tu equipo. Los instaladores no requieren instalar MiKTeX, TeX Live, Node.js ni Rust por separado.

> Proyecto en fase **alpha**. Ya permite editar y exportar documentos, pero todavía no sustituye todas las funciones de un procesador de textos completo.

## Descargar e instalar

Mientras no haya una release publicada, descarga los instaladores desde los **Artifacts** de una [compilación correcta de GitHub Actions](https://github.com/Ifcarlitos/ScribeTex/actions/workflows/desktop-build.yml). GitHub requiere iniciar sesión para descargar estos ZIP; descomprímelos antes de abrir el instalador. Las entregas públicas estables se distribuirán más adelante en [Releases](https://github.com/Ifcarlitos/ScribeTex/releases).

| Sistema | Descarga | Instalación |
| --- | --- | --- |
| Windows x64 | `ScribeTex_0.2.0_x64-setup.exe` · ~16 MiB | Ejecutar el instalador por usuario |
| Linux Debian/Ubuntu x64 | `ScribeTex_0.2.0_amd64.deb` · ~14 MiB | Abrir con el gestor de paquetes |
| Linux x64 | `ScribeTex_0.2.0_amd64.AppImage` · ~88 MiB | Dar permiso de ejecución y abrir |
| macOS Apple Silicon | `ScribeTex_0.2.0_aarch64.dmg` · ~24 MiB | Arrastrar ScribeTex a Aplicaciones |
| macOS Intel | `ScribeTex_0.2.0_x64.dmg` · ~24 MiB | Arrastrar ScribeTex a Aplicaciones |

Los tamaños son aproximados para la versión 0.2.0. Cada entrega incluye un archivo `SHA256SUMS.txt` para comprobar sus descargas.

**Primer PDF:** necesitas conexión para que Tectonic descargue automáticamente los paquetes y las fuentes que utiliza el documento. Después se reutilizan desde la caché. La primera conversión puede tardar varios minutos; los recursos nuevos pueden requerir nuevas descargas. No se incluye una caché completa para trabajar sin conexión desde el primer uso.

**Windows:** WebView2 es necesario; el instalador descarga su instalador si falta. **Linux:** el paquete DEB puede solicitar bibliotecas del sistema y AppImage puede necesitar FUSE. **macOS y Windows:** los instaladores todavía no están firmados ni notarizados; el sistema puede mostrar avisos al abrirlos.

## Funciones disponibles

- Cinta con **Archivo, Inicio, Insertar, Disposición y Vista**.
- Negrita, cursiva, subrayado, tachado, tamaños, colores y familias tipográficas.
- Títulos, listas, alineación, historial y navegación por encabezados.
- Tablas con edición de filas y columnas; imágenes locales PNG y JPEG.
- Galería de 20 estructuras: fracciones, raíces, índices, integrales, sumas, productos, límites, derivadas, vectores, matrices, sistemas y funciones por tramos.
- Editor de matrices de hasta 5 × 5, símbolos matemáticos y previsualización en directo.
- Modo LaTeX matemático para expresiones anidadas y edición posterior al pulsar una fórmula.
- Fórmulas dentro del texto o en una línea aparte; atajos `Alt+=` y `Ctrl/⌘+Enter`.
- Hoja A4, márgenes configurables y zoom.
- Guardado y apertura del formato editable `.scribetex`, con recuperación local del borrador.
- Generación de PDF con el motor incluido y previsualización dentro de la aplicación.
- Exportación `.tex` para documentos sin imágenes.

## Primer documento

1. Abre ScribeTex y empieza a escribir.
2. Usa **Inicio** para el formato y **Insertar** para tablas, imágenes o ecuaciones.
3. Guarda una copia editable desde **Archivo → Guardar** o con `Ctrl+S` (`⌘S` en macOS).
4. Pulsa **Vista previa PDF** y espera a que termine la conversión.
5. Usa **Guardar PDF** en la vista previa. La ubicación de descarga depende del sistema.

## Límites actuales

- El editor muestra una hoja continua: los saltos de página y la composición definitivos los decide LaTeX. La vista previa PDF es la referencia del resultado final.
- El modo LaTeX admite un subconjunto matemático compartido por KaTeX y la exportación con amsmath. No admite documentos completos, paquetes, macros propias ni comandos que lean archivos.
- No se exportan tablas con celdas combinadas ni contenido no compatible; la aplicación muestra un aviso.
- La exportación `.tex` individual no empaqueta imágenes; la generación PDF sí las incluye.
- No hay importación o exportación DOCX, colaboración en tiempo real, comentarios ni control de cambios.
- El autoguardado local no sustituye una copia del archivo `.scribetex`.

Consulta las mejoras previstas en [ROADMAP.md](ROADMAP.md).

## Desarrollo

```sh
git clone https://github.com/Ifcarlitos/ScribeTex.git
cd ScribeTex
npm ci
npm run dev
```

El modo navegador permite desarrollar la interfaz. La generación PDF requiere la aplicación nativa. Los requisitos por sistema, la preparación del motor y las pruebas están en [la guía de desarrollo](docs/DEVELOPMENT.md).

### Arquitectura

```text
React + TypeScript + Tailwind
            ↓
    Tiptap · documento JSON
            ↓
  Serializador LaTeX + imágenes
            ↓
    Tauri / Rust → Tectonic
            ↓
       PDF → visor PDF.js
```

Los documentos se compilan localmente. El motor puede conectarse a sus servidores de paquetes para descargar recursos LaTeX; el código de la aplicación no implementa un servicio remoto de almacenamiento de documentos ni analítica propia.

## Estado de las pruebas

La [compilación de referencia de 0.1.0](https://github.com/Ifcarlitos/ScribeTex/actions/runs/42681765615) terminó correctamente en Windows x64, Linux x64, macOS Intel y Apple Silicon. Incluye siete pruebas del serializador, generación de un PDF con español, ecuación, tabla e imagen, prueba del backend Rust y creación de los instaladores.

En Windows también se han probado manualmente la instalación, la generación, la previsualización y la descarga del PDF. La interfaz de macOS y Linux todavía no se ha revisado manualmente.

La versión 0.2.0 amplía las fórmulas e incluye 33 pruebas del serializador y del editor matemático. Su prueba PDF incluye integrales, sumatorios, límites, matrices, sistemas y funciones por tramos. La [compilación de 0.2.0](https://github.com/Ifcarlitos/ScribeTex/actions/runs/42688143937) ha generado los instaladores de las cuatro variantes y superado sus pruebas PDF.

## Colaborar

Las propuestas, los informes de errores y las pull requests son bienvenidos. Consulta [CONTRIBUTING.md](CONTRIBUTING.md) y [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Para posibles vulnerabilidades, consulta [SECURITY.md](SECURITY.md).

## Licencia y créditos

El código original de ScribeTex está disponible bajo la [licencia MIT](LICENSE). Autor y mantenedor: [Ifcarlitos](https://github.com/Ifcarlitos).

ScribeTex utiliza proyectos de terceros, entre ellos React, Tiptap, Tauri, Tectonic, KaTeX y PDF.js. Sus licencias y atribuciones se describen en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). La licencia de ScribeTex no sustituye las licencias de esas dependencias.
