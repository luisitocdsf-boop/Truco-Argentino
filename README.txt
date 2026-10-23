TRUCO ARGENTINO — PROTOTIPO WEB INSTALABLE

Contenido:
- index.html: estructura de la pantalla Jugar.
- styles.css: diseño adaptable a celulares, negro mate y dorado.
- app.js: interacciones de modos, creación de código, compartir y entrar con código.
- manifest.json + sw.js: base para instalar como PWA y guardar archivos en caché.
- icon.svg: ícono de la app.

IMPORTANTE:
Esta versión funciona como prototipo local. Los códigos de sala se generan en el dispositivo;
no crean salas online reales. Buscar partidas públicas, cuentas, perfiles sincronizados,
cartas privadas y turnos online requieren un backend/servidor que todavía no está incluido.

CÓMO PROBAR DESDE ANDROID:
1. Subí el contenido de esta carpeta a un servicio de hosting estático que publique por HTTPS.
2. Abrí la URL publicada en Chrome Android.
3. Menú ⋮ > "Instalar aplicación" o "Agregar a pantalla principal" (el texto puede variar).
4. Para actualizar el contenido después de cambios, publicá de nuevo los archivos y recargá.

Para trabajar desde el celular se puede usar un editor web como GitHub Codespaces o un editor
que permita crear archivos y publicar un sitio estático. El service worker requiere HTTPS o localhost.
