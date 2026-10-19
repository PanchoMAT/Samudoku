# Samudoku — versión 2

Sudoku Samurai para navegador, preparado para GitHub Pages y diseñado para funcionar bien tanto en computador como en celular.

## Novedades de esta versión

### ⭐ Estrellas acumulables

- El jugador comienza con **4 estrellas**.
- Una pista cuesta **2 estrellas**.
- La primera vez que se completa un desafío se ganan estrellas.
- Hay bonificación por terminar **sin usar pistas** y **sin errores detectados al comprobar**.
- Repetir un desafío ya completado no vuelve a entregar estrellas.
- Las estrellas se guardan en `localStorage` del navegador.

### 🔎 Vista ampliada de cada sudoku

Sobre el tablero aparecen seis botones:

- Vista completa.
- Superior izquierdo.
- Superior derecho.
- Central.
- Inferior izquierdo.
- Inferior derecho.

Al elegir uno de los cinco sudokus, ese tablero se muestra como una cuadrícula 9×9 grande. Esto está especialmente pensado para jugar desde un teléfono.

### 🎮 40 desafíos en grupos de 10

La primera colección tiene cuatro grupos:

1. **Fácil** — 10 desafíos.
2. **Medio** — 10 desafíos.
3. **Difícil** — 10 desafíos.
4. **Experto** — 10 desafíos.

La cantidad de pistas iniciales disminuye progresivamente. Todos los desafíos se derivan de un puzzle Samurai base con solución única y conservan todas sus pistas esenciales; agregar pistas mantiene la unicidad.

### 💾 Progreso guardado

Se guardan por separado:

- estrellas;
- desafíos completados;
- tablero en curso de cada desafío;
- pistas compradas;
- tiempo transcurrido;
- último nivel jugado.

## Archivos que debes reemplazar en GitHub

Reemplaza estos tres archivos de la versión anterior:

- `index.html`
- `style.css`
- `app.js`

No necesita librerías ni instalaciones adicionales.

## GitHub Pages

Si GitHub Pages ya estaba funcionando, no necesitas configurarlo nuevamente. Al reemplazar los archivos y confirmar el commit, la misma dirección web se actualizará automáticamente.

## Próximas ideas

La estructura queda preparada para agregar después notas/candidatos, vidas o errores, logros, sonidos, animaciones, desafíos diarios, más colecciones de puzzles y modo instalable como app (PWA).
