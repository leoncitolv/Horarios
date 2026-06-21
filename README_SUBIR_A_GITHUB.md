# Vol turnos · PWA GitHub Pages

Archivos incluidos:
- `index.html`
- `manifest.webmanifest`
- `service-worker.js`
- `icon-192.png`
- `icon-512.png`

## Cómo subirlo a GitHub
1. Sube estos archivos en la raíz del repositorio, no dentro de una carpeta.
2. En GitHub Pages, publica desde `main` / root.
3. Abre la URL terminada en `/` o `/index.html`.
4. En Android, abre Chrome > menú ⋮ > Agregar a pantalla principal.
5. En iPhone, abre Safari > Compartir > Agregar a pantalla de inicio.

## Corrección realizada
El error 404 en Android normalmente aparece porque el acceso directo intenta abrir una ruta que no existe, por ejemplo `horarios.html`. 
El manifest ahora usa:
- `start_url: "./"`
- `scope: "./"`

También se agregó `service-worker.js` con fallback a `index.html`.
