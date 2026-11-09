# Contribuir a ScribeTex

Gracias por colaborar. ScribeTex está en fase alpha y acepta mejoras pequeñas y revisables.

## Antes de empezar

- Busca si ya existe un issue o una pull request relacionada.
- Para cambios grandes, abre primero un issue con el problema y la propuesta.
- Consulta la [guía de desarrollo](docs/DEVELOPMENT.md).

## Informar de errores

Indica la versión, el sistema operativo y su arquitectura, los pasos para reproducirlo, el resultado esperado y el observado. Si afecta al PDF, adjunta un documento mínimo sin datos personales. Evita publicar documentos privados, rutas personales o registros completos sin revisarlos.

Para vulnerabilidades, sigue [SECURITY.md](SECURITY.md) y evita abrir un issue público con detalles de explotación.

## Enviar una pull request

1. Crea un fork y una rama para el cambio.
2. Mantén la modificación enfocada en un problema.
3. Ejecuta las comprobaciones que correspondan: `npm test`, `npm run build` y, si cambia el backend, `cargo fmt` y la prueba PDF descrita en la guía.
4. Explica qué cambia, por qué y cómo lo has comprobado. Añade capturas cuando cambie la interfaz.
5. No subas dependencias, ejecutables, cachés, documentos privados ni credenciales.

Las pruebas nativas y los instaladores se ejecutan en GitHub Actions. No declares validado un sistema que no hayas probado; identifica el alcance de la comprobación.

## Criterios del proyecto

- Interfaz visual: no exigir que el usuario escriba LaTeX para las funciones principales.
- Compilación PDF local y motor incluido en los instaladores.
- Descargas e instalación contenidas; medir los tamaños antes de prometer mejoras.
- Exportaciones que conserven contenido o avisen cuando algo no se puede representar.
- Accesibilidad, mensajes comprensibles y comportamiento consistente entre sistemas.

## Licencia

Al proponer una contribución, aceptas que se distribuya bajo la licencia MIT del proyecto. No incluyas código o recursos de terceros sin una licencia compatible y sus atribuciones. No se exige ceder la titularidad de tus contribuciones.
