var palabras;
let palabrasEncontradas = new Set();
let totalPalabras = 0;

document.getElementById("sopa-container").style.fontFamily = "sans-serif";
document.querySelector("h1").style.fontSize = "30px";
document.querySelector("h1").style.fontFamily = "sans-serif";
const gridSize = 15;
document.querySelector("#palabras-a-encontrar h2").style.fontFamily =
  "sans-serif"; // Cambia el título de la lista de palabras
document.querySelector("#palabras-a-encontrar h2").style.fontSize = "20px"; // Cambia el título de la lista de palabras

let grid = Array(gridSize)
  .fill(null)
  .map(() => Array(gridSize).fill(""));

// Direcciones posibles (x, y)
const direcciones = [
  [1, 0], // Derecha
  [-1, 0], // Izquierda
  [0, 1], // Abajo
  [0, -1], // Arriba
  [1, 1], // Diagonal abajo-derecha
  [-1, -1], // Diagonal arriba-izquierda
  [1, -1], // Diagonal arriba-derecha
  [-1, 1], // Diagonal abajo-izquierda
];
function cargarCategoriaAleatoria() {
  const index = Math.floor(Math.random() * jugadores_encontrar.length);
  const categoriaSeleccionada = jugadores_encontrar[index];
  const titulo = categoriaSeleccionada[0];
  palabras = categoriaSeleccionada.slice(1);

  // Cambiar el título en el H1
  document.querySelector("h1").textContent = `Sopa de Letras - ${titulo}`;
  // Reiniciar el contador de palabras encontradas
  palabrasEncontradas.clear();
  totalPalabras = palabras.length;

  // Generar la sopa de letras con las nuevas palabras
  generarSopa(palabras);
}

// Función para marcar palabras como encontradas
function palabraEncontrada(palabra) {
  if (!palabrasEncontradas.has(palabra)) {
    palabrasEncontradas.add(palabra);
    // Verificar si todas las palabras han sido encontradas
    if (palabrasEncontradas.size === totalPalabras) {
      mostrarModal();
    }
  }
}
function mostrarModal(titulo, mensaje) {
  const modal = document.getElementById("completado-modal");
  modal.style.display = "flex";

  // Cerrar y recargar cuando se haga clic en el botón
  document.getElementById("volver-inicio").addEventListener("click", () => {
    window.location.href = "index.html"; // Cambia esto si la ruta es diferente
  });
}
function colocarPalabra(palabra) {
  let colocada = false;
  let intentos = 150; // Evitar bucles infinitos

  while (!colocada && intentos > 0) {
    intentos--;
    let x = Math.floor(Math.random() * gridSize);
    let y = Math.floor(Math.random() * gridSize);
    let [dx, dy] = direcciones[Math.floor(Math.random() * direcciones.length)];
    let puedeColocar = true;

    // Verificar si la palabra cabe en la dirección elegida
    for (let i = 0; i < palabra.length; i++) {
      let nx = x + i * dx;
      let ny = y + i * dy;

      if (
        nx < 0 ||
        ny < 0 ||
        nx >= gridSize ||
        ny >= gridSize ||
        (grid[ny][nx] !== "" && grid[ny][nx] !== palabra[i])
      ) {
        puedeColocar = false;
        break;
      }
    }

    // Si cabe y no choca, colocar la palabra
    if (puedeColocar) {
      for (let i = 0; i < palabra.length; i++) {
        let nx = x + i * dx;
        let ny = y + i * dy;
        grid[ny][nx] = palabra[i];
      }
      colocada = true;
    }
  }

  // Si después de muchos intentos no se pudo colocar, avisar en consola
  if (!colocada) {
    console.warn(`No se pudo colocar la palabra: ${palabra}`);
  }
}

// Generar la sopa
function generarSopa(palabras) {
  palabras.forEach(colocarPalabra);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (grid[i][j] === "") {
        grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
  }

  const sopaContainer = document.getElementById("sopa-container");
  sopaContainer.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;
  sopaContainer.style.gridTemplateRows = `repeat(${gridSize}, 30px)`;

  grid.forEach((row, y) => {
    row.forEach((letter, x) => {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.textContent = letter;
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.addEventListener("click", () => seleccionarLetra(cell));
      sopaContainer.appendChild(cell);
    });
  });

  const listaPalabras = document.getElementById("lista-palabras");
  palabras.forEach((palabra) => {
    const li = document.createElement("li");
    li.textContent = palabra;
    li.dataset.palabra = palabra;
    listaPalabras.appendChild(li);
  });
}
let seleccionadas = [];
let mousePresionado = false;
let direccion = null; // Almacena la dirección de la selección

function limpiarSeleccion() {
  seleccionadas.forEach((cell) => cell.classList.remove("selected"));
  seleccionadas = [];
}

function detectarDireccion(cellInicio, cellActual) {
  let xInicio = parseInt(cellInicio.dataset.x);
  let yInicio = parseInt(cellInicio.dataset.y);
  let xActual = parseInt(cellActual.dataset.x);
  let yActual = parseInt(cellActual.dataset.y);

  if (xActual === xInicio) return "vertical"; // Arriba o abajo
  if (yActual === yInicio) return "horizontal"; // Izquierda o derecha
  if (Math.abs(xActual - xInicio) === Math.abs(yActual - yInicio))
    return "diagonal"; // Diagonal

  return null; // No es una dirección válida
}

function seleccionarLetra(cell) {
  if (!seleccionadas.includes(cell)) {
    seleccionadas.push(cell);
    cell.classList.add("selected");
  }
}

// Evento cuando empieza la selección
document
  .getElementById("sopa-container")
  .addEventListener("mousedown", (event) => {
    if (event.target.classList.contains("cell")) {
      limpiarSeleccion(); // 🔹 Limpiar selección anterior antes de empezar una nueva
      mousePresionado = true;
      direccion = null; // Reiniciar dirección
      seleccionarLetra(event.target);
    }
  });

// Evento cuando se arrastra sobre las letras
document
  .getElementById("sopa-container")
  .addEventListener("mouseover", (event) => {
    if (mousePresionado && event.target.classList.contains("cell")) {
      let primeraCelda = seleccionadas[0];

      if (!direccion) {
        direccion = detectarDireccion(primeraCelda, event.target);
      }

      if (
        direccion &&
        detectarDireccion(primeraCelda, event.target) === direccion
      ) {
        seleccionarLetra(event.target);
      }
    }
  });

// Evento cuando se suelta el mouse (validar palabra)
document.addEventListener("mouseup", () => {
  if (seleccionadas.length > 0) {
    validarPalabra();
  }
  mousePresionado = false;
  direccion = null; // Reiniciar dirección
});
// Validar si la palabra seleccionada es correcta
function validarPalabra() {
  let textoSeleccionado = seleccionadas
    .map((cell) => cell.textContent)
    .join("");

  if (palabras.includes(textoSeleccionado)) {
    document
      .querySelector(`li[data-palabra="${textoSeleccionado}"]`)
      .classList.add("encontrada");
    seleccionadas.forEach((cell) => {
      cell.classList.remove("selected");
      cell.classList.add("word-found"); // Cambia el estilo de la palabra encontrada
      palabraEncontrada(textoSeleccionado);
    });
  } else {
    seleccionadas.forEach((cell) => cell.classList.remove("selected"));
  }

  seleccionadas = []; // Reiniciar selección
}

// Iniciar el juego con una categoría aleatoria al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarCategoriaAleatoria();
});
