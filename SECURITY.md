# Seguridad

ScribeTex está en fase alpha. Mantén una copia de los documentos importantes y utiliza la versión más reciente disponible. No hay versiones con soporte prolongado ni un plazo garantizado de respuesta.

## Comunicar una posible vulnerabilidad

Usa [GitHub Private Vulnerability Reporting](https://github.com/Ifcarlitos/ScribeTex/security/advisories/new) si está habilitado para el repositorio. Describe la versión, el sistema afectado, el impacto y una reproducción mínima sin datos personales.

Si GitHub no ofrece el formulario privado, abre un issue indicando únicamente que necesitas un canal privado de seguridad. No incluyas el fallo, documentos sensibles, credenciales ni instrucciones de explotación en ese issue público.

## Alcance

Son relevantes la ejecución de comandos o lectura de archivos no autorizadas, las rutas de recursos, las descargas del motor, las dependencias y el tratamiento de documentos no confiables.

El modo no confiable del motor, los nombres de imágenes controlados y los límites de proceso reducen riesgos, pero no proporcionan un aislamiento completo del sistema operativo. El motor LaTeX se ejecuta con los permisos del usuario.

## Datos y conexiones

La compilación se realiza en el equipo. Tectonic puede descargar paquetes y fuentes por Internet y guardarlos en caché. La aplicación conserva un borrador local y permite guardar copias; no implementa un servicio propio de almacenamiento remoto de documentos.
