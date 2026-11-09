# Third-party notices

The original ScribeTex code is distributed under the MIT license in `LICENSE`. Dependencies, bundled software, fonts and other third-party resources retain their own copyright notices and licenses. This document does not relicense them.

## Main components

| Component | Declared license | Upstream |
| --- | --- | --- |
| React / React DOM | MIT | https://github.com/facebook/react |
| Tiptap editor and included extensions | MIT | https://github.com/ueberdosis/tiptap |
| ProseMirror packages | MIT | https://github.com/ProseMirror |
| Tauri and its JavaScript API | MIT OR Apache-2.0 | https://github.com/tauri-apps/tauri |
| Tectonic 0.17.0 | MIT for Tectonic; derived components have additional licenses | https://github.com/tectonic-typesetting/tectonic |
| KaTeX | MIT | https://github.com/KaTeX/KaTeX |
| PDF.js | Apache-2.0 | https://github.com/mozilla/pdf.js |
| Floating UI | MIT | https://github.com/floating-ui/floating-ui |
| Tailwind CSS | MIT | https://github.com/tailwindlabs/tailwindcss |
| Vite | MIT | https://github.com/vitejs/vite |
| TypeScript | Apache-2.0 | https://github.com/microsoft/TypeScript |

The installed package versions are recorded in `package-lock.json` and `src-tauri/Cargo.lock`. Review the relevant upstream license files when changing dependencies or distributing modified binaries. Development tools have their own licenses as well.

## Bundled LaTeX engine

Official Tectonic binaries are fetched during packaging; they are not committed to the source repository. The download script pins version and SHA-256 for each supported platform.

The Tectonic license is preserved in `.github/licenses/TECTONIC-LICENSE.txt` and copied beside the engine in the installer together with its provenance. Tectonic incorporates code from TeX-related systems and other third-party projects under their respective licenses. See its [licensing documentation](https://github.com/tectonic-typesetting/tectonic/blob/tectonic%400.17.0/LICENSE) and [source tree](https://github.com/tectonic-typesetting/tectonic/tree/tectonic%400.17.0) for those components.

LaTeX packages and fonts downloaded by the engine retain their original licenses. They are not assigned ScribeTex's MIT license.

## Branding

The ScribeTex application icon and interface in this repository were created for this project. Microsoft Word is referenced only to explain the familiar editing experience; Microsoft code, icons and artwork are not included. ScribeTex is an independent project.
