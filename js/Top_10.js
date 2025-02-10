async function obtenerBandera(nombreEquipo) {
  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${nombreEquipo}`
    );
    const data = await response.json();
    return data.teams ? data.teams[0].strBadge : "img/default.png"; // Imagen por defecto si no hay datos
  } catch (error) {
    console.error(`Error obteniendo la bandera de ${nombreEquipo}:`, error);
    return "img/default.png"; // Imagen de respaldo en caso de error
  }
}
function removerAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function extraerJugadores(preguntas) {
  let jugadoresDisponibles = [];

  preguntas.forEach((pregunta) => {
    // Ignorar el primer elemento (título) y recorrer los jugadores
    pregunta.slice(1).forEach((jugador) => {
      if (!jugadoresDisponibles.includes(jugador[0])) {
        jugadoresDisponibles.push(jugador[0]); // Solo agregar el nombre del jugador
      } else {
        console.log("Jugador: " + jugador[0] + " ya agregado");
      }
    });
  });

  return jugadoresDisponibles;
}

document.addEventListener("DOMContentLoaded", () => {
  const preguntaElemento = document.getElementById("pregunta");
  const listaJugadores = document.getElementById("lista-jugadores");
  const cambiarRankingBtn = document.getElementById("cambiar-ranking");
  // Llamar a la función y obtener los nombres
  const jugadoresDisponibles = extraerJugadores(preguntasTOP10);
  console.log(jugadoresDisponibles);

  // Función para cargar un ranking aleatorio
  async function cargarRankingAleatorio() {
    rankingActual =
      preguntasTOP10[Math.floor(Math.random() * preguntasTOP10.length)];
    pintarRanking();
  }

  // Función para pintar el ranking en el HTML
  async function pintarRanking() {
    preguntaElemento.textContent = rankingActual[0]; // Título del ranking
    listaJugadores.innerHTML = ""; // Limpiar lista
    // Obtener banderas solo para los jugadores del ranking actual
    const banderasPromises = rankingActual
      .slice(1)
      .map(async ([nombre, equipo]) => {
        return [nombre, await obtenerBandera(equipo)];
      });

    const jugadoresConBanderas = await Promise.all(banderasPromises); // Esperar todas las peticiones antes de continuar
    jugadoresConBanderas.forEach(([nombre, banderaURL], index) => {
      const divJugador = document.createElement("div");
      divJugador.classList.add("jugador-container");

      const numero = document.createElement("span");
      numero.textContent = `${index + 1} | `;

      const bandera = document.createElement("img");
      bandera.src = banderaURL;
      bandera.alt = `Bandera de ${nombre}`;
      bandera.classList.add("bandera-img");
      const inputContainer = document.createElement("div");
      inputContainer.style.position = "relative";
      inputContainer.style.width = "100%";
      const input = document.createElement("input");
      input.type = "text";
      input.classList.add("jugador-input");
      input.placeholder = `Jugador ${index + 1}`;
      input.dataset.index = index; // Guardar índice para validación

      // Evento para validar respuesta al presionar "Enter"
      input.addEventListener("keyup", validarRespuesta);
      input.addEventListener("input", () => mostrarSugerencias(input));
      const sugerenciasDiv = document.createElement("div");
      sugerenciasDiv.classList.add("sugerencias");
      sugerenciasDiv.style.display = "none";

      inputContainer.appendChild(input);
      inputContainer.appendChild(sugerenciasDiv);

      divJugador.appendChild(numero);
      divJugador.appendChild(bandera);
      divJugador.appendChild(inputContainer);
      listaJugadores.appendChild(divJugador);
      iniciarContador(120);
    });
  }
  // Función para mostrar sugerencias
  function mostrarSugerencias(input) {
    const sugerenciasDiv = input.nextElementSibling; // El div de sugerencias está justo después del input
    const textoIngresado = input.value.toLowerCase();

    sugerenciasDiv.innerHTML = "";
    if (!textoIngresado) {
      sugerenciasDiv.style.display = "none";
      return;
    }

    const sugerenciasFiltradas = jugadoresDisponibles.filter((jugador) =>
      jugador.toLowerCase().includes(textoIngresado)
    );

    if (sugerenciasFiltradas.length === 0) {
      sugerenciasDiv.style.display = "none";
      return;
    }

    sugerenciasFiltradas.forEach((jugador) => {
      const sugerencia = document.createElement("div");
      sugerencia.textContent = jugador;
      sugerencia.classList.add("sugerencia-item");

      sugerencia.addEventListener("click", () => {
        input.value = jugador; // Autocompleta el input
        sugerenciasDiv.style.display = "none"; // Oculta las sugerencias
        validarRespuesta({ target: input, key: "Enter" }); // Llama a la validació
      });
      sugerenciasDiv.appendChild(sugerencia);
    });

    sugerenciasDiv.style.display = "block";
  }
  // Función para validar respuestas
  function validarRespuesta(event) {
    if (event.key === "Enter" || event.type === "click") {
      // Validar también en clic de sugerencia
      const input = event.target;
      const index = input.dataset.index;
      var respuestaCorrecta =
        rankingActual[parseInt(index) + 1][0].toLowerCase();
      respuestaCorrecta = removerAcentos(respuestaCorrecta);
      var respuestaImput = removerAcentos(input.value.trim().toLowerCase());
      if (respuestaImput == respuestaCorrecta) {
        input.classList.remove("incorrecto");
        input.classList.add("correcto");
        input.disabled = true; // 🔒 Bloquea el input si es correcto
      } else {
        input.classList.add("incorrecto");
      }

      // Verificar si todos los jugadores han sido ingresados correctamente
      if (
        [...document.querySelectorAll(".jugador-input")].every(
          (inp, i) =>
            inp.value.trim().toLowerCase() ===
            rankingActual[i + 1][0].toLowerCase()
        )
      ) {
        mostrarModal(
          "¡Completado!",
          "Has ordenado correctamente a los jugadores."
        );
      }
    }
  }
  function iniciarContador(duracionSegundos) {
    const contadorElemento = document.getElementById("contador");
    let tiempoRestante = duracionSegundos;

    function actualizarContador() {
      const minutos = Math.floor(tiempoRestante / 60);
      const segundos = tiempoRestante % 60;
      contadorElemento.textContent = `Tiempo restante: ${minutos}:${
        segundos < 10 ? "0" : ""
      }${segundos}`;

      if (tiempoRestante <= 0) {
        clearInterval(intervalo);
        finalizarJuego();
      } else {
        tiempoRestante--;
      }
    }

    actualizarContador(); // Mostrar tiempo inicial inmediatamente
    const intervalo = setInterval(actualizarContador, 1000);
  }

  function finalizarJuego() {
    mostrarModal("¡Tiempo agotado!", "Se acabó el tiempo. Inténtalo de nuevo.");
  }
  function mostrarModal(titulo, mensaje) {
    const modal = document.getElementById("completado-modal");
    modal.querySelector("h2").textContent = titulo;
    modal.querySelector("p").textContent = mensaje;
    modal.style.display = "flex";

    // Cerrar y recargar cuando se haga clic en el botón
    document.getElementById("volver-inicio").addEventListener("click", () => {
      window.location.href = "index.html"; // Cambia esto si la ruta es diferente
    });
  }
  // Cargar un ranking al iniciar la página
  cargarRankingAleatorio();
});
