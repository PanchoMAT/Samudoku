# Samudoku

Primera versión de **Samudoku**, un Sudoku Samurai formado por cinco sudokus 9×9 superpuestos.

## Qué incluye esta versión

- Tablero Samurai completo de 21×21 posiciones.
- Cinco sudokus conectados por cuatro regiones 3×3 compartidas.
- Puzzle de demostración con solución única.
- Resaltado del sudoku activo.
- Resaltado especial de las zonas compartidas.
- Selección de filas, columnas y bloques relacionados.
- Teclado numérico en pantalla.
- Soporte para teclado físico.
- Botón de comprobación.
- Sistema de pistas.
- Cronómetro.
- Progreso de casillas completadas.
- Guardado automático en el navegador mediante `localStorage`.
- Diseño adaptable a computador y celular.
- Sin librerías externas: solo HTML, CSS y JavaScript.

## Archivos

- `index.html`: estructura de la aplicación.
- `style.css`: diseño visual y versión responsive.
- `app.js`: lógica del juego.

## Publicarlo con GitHub Pages

1. Crea un repositorio nuevo en GitHub. Por ejemplo: `samudoku`.
2. Sube los tres archivos principales a la raíz del repositorio:
   - `index.html`
   - `style.css`
   - `app.js`
3. En GitHub entra a **Settings → Pages**.
4. En **Build and deployment**, elige:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Guarda los cambios.
6. GitHub Pages te entregará la dirección pública del juego.

## Próximas extensiones previstas

La estructura está preparada para evolucionar hacia:

- varios niveles de dificultad;
- biblioteca de puzzles;
- selector de dificultad;
- notas/candidatos;
- sistema de errores o vidas;
- estadísticas;
- rachas diarias;
- logros y recompensas;
- sonidos;
- animaciones;
- temas visuales;
- modo "Sudoku Mamita";
- generador de nuevos Samudokus.

## Nota técnica

La dificultad actual se llama **Demo · Intermedio**. El puzzle está incorporado directamente en `app.js`. En una versión siguiente conviene separar los puzzles en un archivo de datos para poder añadir niveles sin modificar la lógica principal.
