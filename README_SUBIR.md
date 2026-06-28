# Vol turnos · PWA independiente

Sube estos archivos a la raíz del repo `horario`:

- index.html
- styles.css
- manifest-horarios.json
- sw.js
- icon-horarios-192.png
- icon-horarios-512.png

La app queda lista para abrirse desde:

https://leoncitolv.github.io/horario/

## Qué se corrigió

- El botón Inicio ya no manda al launcher; ahora apunta a `./` dentro de la misma app.
- Se agregó manifest propio con `display: standalone`, `start_url: ./` y `scope: ./`.
- Se agregaron los iconos de Vol turnos con los nombres que ya usa el HTML.
- Se agregó `sw.js` para que el shell de la app cargue offline después de la primera visita.
- El CSS tiene cache-busting `styles.css?v=2.9.1-pwa`.

## Para instalar en móvil

1. Abre https://leoncitolv.github.io/horario/
2. En Chrome/Android: toca Instalar o Agregar a pantalla principal.
3. En iPhone/Safari: Compartir → Agregar a pantalla de inicio.

Si ya existía un acceso anterior, elimínalo y vuelve a agregarlo para que tome el icono actualizado.
