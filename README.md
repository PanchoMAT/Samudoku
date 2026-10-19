# Samudoku v3

**Samudoku** es un Sudoku Samurai jugable directamente en el navegador y preparado para GitHub Pages.

## Novedades de esta versión

### Resaltado global de números
Al seleccionar un número del teclado lateral, todas sus apariciones se resaltan en el tablero completo. El botón **Quitar marca** elimina el resaltado.

### Música ambiental
El botón **🎵 Música** activa una música ambiental suave generada directamente por el navegador con Web Audio API. No usa archivos externos ni música con derechos de autor. Por las políticas de los navegadores, la música comienza solo después de que la persona pulse el botón.

### Creador de Samudoku
La sección **Crea tu propio Samudoku** permite diseñar desafíos personalizados.

- Parte de una solución Samurai válida.
- Se crean desafíos ocultando o mostrando pistas.
- Incluye borradores Fácil, Medio, Difícil y Experto.
- El analizador comprueba si el desafío es resoluble.
- Detecta si la solución es única o si existen varias soluciones.
- Estima la dificultad mediante una combinación de cantidad de pistas y esfuerzo del solucionador automático.
- Solo habilita el enlace compartible cuando puede certificar una solución única.
- El desafío se codifica directamente en la URL, por lo que no se necesita servidor ni base de datos.
- Quien recibe el enlace puede jugar el desafío dentro del mismo Samudoku.

> La dificultad es una estimación orientativa. Una medida de dificultad humana exacta requeriría modelar técnicas concretas de resolución.

### Celebraciones
Cada vez que se completa uno de los cinco sudokus 9×9 aparece una celebración breve con fuegos artificiales. Al completar el Samurai completo se muestra una celebración mayor.

### Sistema de estrellas
Se conserva el sistema de estrellas de la versión anterior:

- Se empieza con 4 ⭐.
- Cada pista cuesta 2 ⭐.
- Los niveles oficiales entregan estrellas la primera vez que se completan.
- Los desafíos personalizados no entregan estrellas para evitar que se pueda alterar la economía del juego creando puzzles triviales.

## Niveles incluidos

- 10 Fácil
- 10 Medio
- 10 Difícil
- 10 Experto

Los 40 niveles oficiales mantienen solución única.

## Archivos

- `index.html`
- `style.css`
- `app.js`
- `README.md`

## Actualizar GitHub Pages

Reemplaza `index.html`, `style.css` y `app.js` en la raíz del repositorio y realiza un nuevo commit. No es necesario volver a configurar GitHub Pages.

