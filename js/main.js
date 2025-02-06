async function obtenerEscudos(nombreEquipo) {
  const response = await fetch(
    `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${nombreEquipo}`
  );
  const data = await response.json();
  return data.teams ? data.teams[0].strBadge : ""; // Manejo de error si no hay datos
}

async function actualizarEscudos() {
  const escudosActualizados = await Promise.all(
    futbolistaActual.escudos.map(
      async (nombreEquipo) => await obtenerEscudos(nombreEquipo)
    )
  );
  futbolistaActual.escudos = escudosActualizados;
}
function removerAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
document.addEventListener("DOMContentLoaded", async () => {
  const escudosContainer = document.getElementById("escudos-container");
  const respuestaInput = document.getElementById("respuesta");
  const comprobarBtn = document.getElementById("comprobar");
  const resultado = document.getElementById("resultado");

  let tiempoRestante = 60; // Tiempo inicial en segundos
  let temporizador;
  let aciertos = 0; // Contador de aciertos
  let historialScores = [];
  let nombreJugador = "Jugador " + contador;
  // Pedir el nombre del jugador antes de iniciar el juego

  const sugerenciasDiv = document.getElementById("sugerencias");
  respuestaInput.addEventListener("input", () => {
    const texto = respuestaInput.value.trim().toLowerCase();
    if (texto === "") {
      sugerenciasDiv.style.display = "none"; // Oculta las sugerencias si no hay texto
      return;
    }

    // Filtra los nombres que coincidan con el texto
    const sugerencias = FutbolistasSugerencias.filter((futbolista) =>
      futbolista.nombre.toLowerCase().includes(texto)
    );

    // Muestra las sugerencias
    mostrarSugerencias(sugerencias);
  });

  function mostrarSugerencias(sugerencias) {
    if (sugerencias.length === 0) {
      sugerenciasDiv.style.display = "none"; // Oculta las sugerencias si no hay coincidencias
      return;
    }

    // Crea los elementos de las sugerencias
    sugerenciasDiv.innerHTML = "";
    sugerencias.forEach((sugerencia) => {
      const div = document.createElement("div");
      div.textContent = sugerencia.nombre;
      div.addEventListener("click", () => {
        respuestaInput.value = sugerencia.nombre; // Completa el campo con la sugerencia
        sugerenciasDiv.style.display = "none"; // Oculta las sugerencias
      });
      sugerenciasDiv.appendChild(div);
    });

    sugerenciasDiv.style.display = "block"; // Muestra las sugerencias
  }

  // Oculta las sugerencias al hacer clic fuera del campo de entrada
  document.addEventListener("click", (event) => {
    if (event.target !== respuestaInput) {
      sugerenciasDiv.style.display = "none";
    }
  });
  async function iniciarJuego() {
    futbolistasObj = futbolistasRespaldo;
    futbolistaActual =
      futbolistasObj[Math.floor(Math.random() * futbolistasObj.length)];

    await actualizarEscudos(); // Esperar a que se actualicen los escudos
    escudosContainer.innerHTML = "";
    futbolistaActual.escudos.forEach((escudo, index) => {
      const img = document.createElement("img");
      img.src = escudo;
      escudosContainer.appendChild(img);
      // Agrega una flecha después de cada escudo (excepto el último)
      if (index < futbolistaActual.escudos.length - 1) {
        const flecha = document.createElement("span");
        flecha.className = "flecha";
        flecha.textContent = "→";
        escudosContainer.appendChild(flecha);
      }
    });

    respuestaInput.value = "";
    resultado.textContent = "";

    if (!temporizador) {
      tiempoRestante = 60; // Reinicia el tiempo
      document.getElementById(
        "contador"
      ).textContent = `Tiempo restante: ${tiempoRestante} segundos`;
      iniciarTemporizador();
    }
    document.getElementById("intentar-de-nuevo").style.display = "none";
    document.getElementById("score").textContent = `Aciertos: ${aciertos}`;
  }
  function iniciarTemporizador() {
    temporizador = setInterval(() => {
      tiempoRestante--;
      document.getElementById(
        "contador"
      ).textContent = `Tiempo restante: ${tiempoRestante} segundos`;

      if (tiempoRestante <= 0) {
        clearInterval(temporizador);
        temporizador = null; // Reinicia la variable del temporizador

        document.getElementById("resultado").textContent = "¡Tiempo agotado!";
        document.getElementById("resultado").style.color = "red";
        document.getElementById("intentar-de-nuevo").style.display = "block"; // Muestra el botón

        // Guarda el score en el historial
        // Guarda el score en el historial junto con el nombre del jugador
        // Deshabilitar el campo de entrada y el botón de confirmar
        respuestaInput.disabled = true;
        comprobarBtn.disabled = true;
        guardarScore(nombreJugador, aciertos); // Reinicia los aciertos
        contador++;
        aciertos = 0;
        document.getElementById("score").textContent = `Aciertos: ${aciertos}`;
      }
    }, 1000); // Actualiza cada segundo
  }
  function guardarScore(nombre, aciertos) {
    // Agrega el score al historial
    historialScores.push({ nombre, aciertos });

    // Ordena el historial de scores de mayor a menor
    historialScores.sort((a, b) => b.aciertos - a.aciertos);

    // Muestra el historial de scores
    const listaScores = document.getElementById("lista-scores");
    listaScores.innerHTML = ""; // Limpia la lista antes de actualizarla
    historialScores.forEach((score, index) => {
      const li = document.createElement("li");
      li.textContent = `${score.nombre}: ${score.aciertos} aciertos`;
      listaScores.appendChild(li);
    });
  }

  comprobarBtn.addEventListener("click", () => {
    const respuestaUsuario = removerAcentos(
      respuestaInput.value.trim().toLowerCase()
    );
    const respuestaCorrecta = removerAcentos(
      futbolistaActual.nombre.toLowerCase()
    );
    if (respuestaUsuario === respuestaCorrecta) {
      aciertos++; // Incrementa el contador de aciertos
      document.getElementById("score").textContent = `Aciertos: ${aciertos}`; // Actualiza el score
      resultado.textContent = "¡Correcto!";
      resultado.style.color = "green";
      setTimeout(iniciarJuego, 500);
    } else {
      resultado.textContent = "Incorrecto, intenta de nuevo.";
      resultado.style.color = "red";
    }
  });

  const transformarFutbolistas = (futbolistas) =>
    futbolistas.map(([nombre, ...escudos]) => ({ nombre, escudos }));
  const transformarFutbolistasSugerencias = (futbolistas) =>
    futbolistas.map(([nombre]) => ({ nombre }));
  FutbolistasSugerencias = transformarFutbolistasSugerencias(futbolistas);
  futbolistasObj = transformarFutbolistas(futbolistas);
  futbolistasRespaldo = futbolistasObj;
  document.getElementById("intentar-de-nuevo").addEventListener("click", () => {
    respuestaInput.disabled = false;
    comprobarBtn.disabled = false;

    iniciarJuego();
    // Reinicia el juego cuando se hace clic en el botón
  });
  await iniciarJuego(); // Asegurarse de esperar la carga de datos antes de pintar
});
