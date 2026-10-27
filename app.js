const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const playScreen = $("#playScreen");
const detailScreen = $("#detailScreen");
const detailContent = $("#detailContent");
const backButton = $("#backButton");
const toast = $("#toast");

let selectedMode = "2 vs 2";
let toastTimer;

// 1 = empieza el jugador; -1 = empieza la máquina.
// Se conserva entre partidas nuevas.
let empiezaPrimeraMano = 1;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function showPlay() {
  playScreen.hidden = false;
  detailScreen.hidden = true;
  backButton.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showDetail(eyebrow, title, description, html) {
  playScreen.hidden = true;
  detailScreen.hidden = false;
  backButton.hidden = false;
  $("#detailEyebrow").textContent = eyebrow;
  $("#detailTitle").textContent = title;
  $("#detailDescription").textContent = description;
  detailContent.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function modePicker(defaultMode = selectedMode) {
  return `
    <span class="field-label">Modo de juego</span>
    <div class="chip-row">
      ${["1 vs 1", "2 vs 2", "3 vs 3"].map(mode => `
        <button class="chip ${mode === defaultMode ? "selected" : ""}"
          type="button" data-pick-mode="${mode}">${mode}</button>
      `).join("")}
    </div>
  `;
}

function attachModePicker() {
  $$("[data-pick-mode]").forEach(button => {
    button.addEventListener("click", () => {
      selectedMode = button.dataset.pickMode;
      $$("[data-pick-mode]").forEach(b =>
        b.classList.toggle("selected", b === button)
      );
    });
  });
}

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function createRoom() {
  selectedMode = "2 vs 2";

  showDetail(
    "SALA PRIVADA",
    "Creá tu mesa",
    "Elegí el formato y generá un código para compartir.",
    `
      ${modePicker()}
      <label class="field-label" for="nickname">Tu apodo</label>
      <input class="text-input" id="nickname" maxlength="18"
        placeholder="Ej. ElMano" autocomplete="nickname">
      <button class="primary-button" id="makeRoomButton">
        Crear sala y generar código
      </button>
      <p class="helper">
        Versión de prueba: todavía no crea una sala online real.
      </p>
      <div id="roomResult"></div>
    `
  );

  attachModePicker();

  $("#makeRoomButton").addEventListener("click", () => {
    const nickname = $("#nickname").value.trim();

    if (!nickname) {
      showToast("Escribí un apodo para continuar.");
      $("#nickname").focus();
      return;
    }

    const code = makeRoomCode();

    $("#roomResult").innerHTML = `
      <div class="room-code">${code}</div>
      <p class="helper">
        Modo: <strong>${escapeHtml(selectedMode)}</strong> ·
        Anfitrión: <strong>${escapeHtml(nickname)}</strong>
      </p>
      <button class="secondary-button" id="shareCodeButton">
        Compartir código
      </button>
    `;

    $("#shareCodeButton").addEventListener("click", async () => {
      const shareText =
        `¡Sumate a mi mesa de Truco Argentino! Código: ${code} · Modo: ${selectedMode}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: "Sala de Truco Argentino",
            text: shareText
          });
        } catch (error) {
          if (error.name !== "AbortError") {
            showToast("No se pudo compartir.");
          }
        }
      } else if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(shareText);
          showToast("Código copiado.");
        } catch {
          showToast(shareText);
        }
      } else {
        showToast(shareText);
      }
    });

    showToast("Código generado. La sala online todavía no está conectada.");
  });
}

function joinRoom() {
  showDetail(
    "ENTRAR A UNA SALA",
    "¿Tenés un código?",
    "Pedile el código al amigo que creó la mesa.",
    `
      <label class="field-label" for="roomCodeInput">Código de sala</label>
      <input class="text-input" id="roomCodeInput" maxlength="6"
        placeholder="ABC123" autocapitalize="characters" autocomplete="off">
      <button class="primary-button" id="joinRoomButton">Continuar</button>
      <p class="helper">La conexión online todavía no está disponible.</p>
    `
  );

  $("#roomCodeInput").addEventListener("input", e => {
    e.target.value = e.target.value.toUpperCase()
      .replace(/[^A-Z0-9]/g, "").slice(0, 6);
  });

  $("#joinRoomButton").addEventListener("click", () => {
    if ($("#roomCodeInput").value.trim().length !== 6) {
      showToast("El código debe tener 6 caracteres.");
      return;
    }
    showToast("El formato es correcto, pero falta conectar las salas online.");
  });
}

function publicMatch() {
  selectedMode = "2 vs 2";

  showDetail(
    "PARTIDA PÚBLICA",
    "Buscá una mesa",
    "Elegí el modo que preferís.",
    `
      ${modePicker()}
      <button class="primary-button" id="searchButton">Buscar partida</button>
      <div id="searchResult"></div>
      <p class="helper">La búsqueda real necesita un servidor online.</p>
    `
  );

  attachModePicker();

  $("#searchButton").addEventListener("click", () => {
    $("#searchResult").innerHTML = `
      <div class="detail-panel" style="margin-top:14px;text-align:center">
        <strong>Modo seleccionado: ${escapeHtml(selectedMode)}</strong>
        <p class="helper">Todavía no hay conexión con un servidor.</p>
        <button class="secondary-button" id="cancelSearch">Cancelar</button>
      </div>
    `;
    $("#cancelSearch").addEventListener("click", () => {
      $("#searchResult").innerHTML = "";
      showToast("Búsqueda cancelada.");
    });
  });
}

$$("[data-mode]").forEach(button => {
  button.addEventListener("click", () => {
    selectedMode = button.dataset.mode;

    showDetail(
      "MODO DE JUEGO",
      selectedMode,
      "Elegí cómo querés armar la partida.",
      `
        <div class="detail-panel" style="text-align:center">
          <div style="font-size:45px;color:var(--gold-light)">♠</div>
          <strong>${escapeHtml(selectedMode)}</strong>
          <p class="helper">Creá una sala o buscá una partida pública.</p>
        </div>
        <button class="primary-button" id="privateWithMode">Crear sala privada</button>
        <button class="secondary-button" id="publicWithMode">Buscar partida pública</button>
      `
    );

    $("#privateWithMode").addEventListener("click", createRoom);
    $("#publicWithMode").addEventListener("click", publicMatch);
  });
});

$("#createRoom").addEventListener("click", createRoom);
$("#joinRoom").addEventListener("click", joinRoom);
$("#publicMatch").addEventListener("click", publicMatch);
$("#playVsMachine").addEventListener("click", startMachineGame);

// ======================================================
// JUEGO CONTRA LA MÁQUINA
// ======================================================

function nombreCarta(carta) {
  const nombres = {
    1: "As", 2: "2", 3: "3", 4: "4", 5: "5",
    6: "6", 7: "7", 10: "Sota", 11: "Caballo", 12: "Rey"
  };
  return `${nombres[carta.valor]} de ${carta.palo}`;
}

function imagenCarta(carta) {
  const palos = {
    Espada: "espada",
    Basto: "basto",
    Oro: "oro",
    Copa: "copa"
  };

  const nombres = {
    1: "1", 2: "2", 3: "3", 4: "4", 5: "5",
    6: "6", 7: "7", 10: "sota", 11: "caballo", 12: "rey"
  };

  return `./cartas/${palos[carta.palo]}_${nombres[carta.valor]}.png`;
}

function fuerzaCarta(carta) {
  if (carta.valor === 1 && carta.palo === "Espada") return 14;
  if (carta.valor === 1 && carta.palo === "Basto") return 13;
  if (carta.valor === 7 && carta.palo === "Espada") return 12;
  if (carta.valor === 7 && carta.palo === "Oro") return 11;
  if (carta.valor === 3) return 10;
  if (carta.valor === 2) return 9;
  if (carta.valor === 1) return 8;
  if (carta.valor === 12) return 7;
  if (carta.valor === 11) return 6;
  if (carta.valor === 10) return 5;
  if (carta.valor === 7) return 4;
  if (carta.valor === 6) return 3;
  if (carta.valor === 5) return 2;
  if (carta.valor === 4) return 1;
  return 0;
}

function resultadoRonda(jugador, maquina) {
  const j = fuerzaCarta(jugador);
  const m = fuerzaCarta(maquina);
  return j > m ? 1 : m > j ? -1 : 0;
}

function ganadorMano(resultados) {
  const [r1, r2, r3] = resultados;

  if (r1 === 0 && r2 !== 0) return r2;
  if (r1 === 0 && r2 === 0) return r3;
  if (r1 !== 0 && r1 === r2) return r1;
  if (r1 !== 0 && r2 !== 0 && r1 !== r2) {
    return r3 !== 0 ? r3 : r1;
  }
  if (r2 === 0 && r1 !== 0) return r1;
  return r3;
}

function startMachineGame() {
  const game = { nosotros: 0, ellos: 0 };

  function renderGame() {
    showDetail(
      "TRUCO ARGENTINO",
      "Tu mano",
      "Jugá tus cartas contra la máquina. Primero en llegar a 30 puntos gana.",
      `
        <div class="detail-panel machine-game">
          <div class="scoreboard">
            <section class="score-team">
              <h3>NOSOTROS</h3>
              <div class="score-number" id="machinePlayerScore">${game.nosotros}</div>
            </section>
            <section class="score-team">
              <h3>MÁQUINA</h3>
              <div class="score-number" id="machineOpponentScore">${game.ellos}</div>
            </section>
          </div>

          <p class="helper" id="machineGameStatus">Prepará la próxima mano.</p>

          <button class="primary-button" id="dealCardsButton">
            Repartir cartas
          </button>

          <div id="cardsArea"></div>
        </div>
      `
    );

    $("#dealCardsButton").addEventListener("click", repartir);
  }

  function repartir() {
    if (game.nosotros >= 30 || game.ellos >= 30) {
      showToast("La partida terminó. Iniciá una nueva partida.");
      return;
    }

    const palos = ["Espada", "Basto", "Oro", "Copa"];
    const valores = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
    const baraja = [];

    palos.forEach(palo => {
      valores.forEach(valor => baraja.push({ palo, valor }));
    });

    for (let i = baraja.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
    }

    const jugador = baraja.slice(0, 3);
    const maquina = baraja.slice(3, 6);
    const resultados = [];

    let ronda = 0;
    let terminada = false;

    // La primera mano de cada partida respeta el turno guardado.
    let empieza = empiezaPrimeraMano;

    $("#dealCardsButton").hidden = true;

    $("#cardsArea").innerHTML = `
      <section class="table-opponent">
        <h3>LA MÁQUINA</h3>
        <div class="machine-cards" id="machineCardsArea">
          ${maquina.map(() => `
            <div class="opponent-card" aria-label="Carta oculta">🂠</div>
          `).join("")}
        </div>
      </section>

      <section class="table-center">
        <h3>LA MESA</h3>
        <div class="table-play" id="tableArea">
          <p class="helper">Preparando la mano...</p>
        </div>
      </section>

      <section class="table-player">
        <h3>TUS CARTAS</h3>
        <div class="player-cards" id="playerCardsArea">
          ${jugador.map((carta, i) => `
            <button class="play-card" data-card="${i}" type="button"
              aria-label="Jugar ${nombreCarta(carta)}">
              <img src="${imagenCarta(carta)}" alt="${nombreCarta(carta)}"
                onerror="this.style.display='none';this.nextElementSibling.hidden=false">
              <span class="card-fallback" hidden>${escapeHtml(nombreCarta(carta))}</span>
            </button>
          `).join("")}
        </div>
      </section>

      <p class="round-result" id="roundResult">Ronda 1 de 3.</p>
      <div id="handResult"></div>

      <button class="primary-button" id="newDealButton" hidden>
        Repartir otra mano
      </button>
      <button class="secondary-button" id="newMatchButton" hidden>
        Nueva partida
      </button>
    `;

    const botones = $$("#playerCardsArea .play-card");

    function revelarCartaMaquina(indice) {
      const carta = maquina[indice];
      const elemento = $("#machineCardsArea").children[indice];

      elemento.innerHTML = `
        <img src="${imagenCarta(carta)}"
          alt="${escapeHtml(nombreCarta(carta))}"
          onerror="this.outerHTML='<span class=&quot;card-fallback&quot;>${escapeHtml(nombreCarta(carta))}</span>'">
      `;
      elemento.classList.add("card-revealed");
    }

    function mostrarMesa(cartaJugador, cartaMaquina, resultado, maquinaAbre) {
      const jugadaJugador = `
        <div class="played-card ${resultado === 1 ? "round-winner" : ""}">
          <span class="played-by">VOS</span>
          <img src="${imagenCarta(cartaJugador)}"
            alt="${escapeHtml(nombreCarta(cartaJugador))}"
            onerror="this.style.display='none';this.nextElementSibling.hidden=false">
          <span class="card-fallback" hidden>${escapeHtml(nombreCarta(cartaJugador))}</span>
          <span class="played-name">${escapeHtml(nombreCarta(cartaJugador))}</span>
        </div>
      `;

      const jugadaMaquina = `
        <div class="played-card ${resultado === -1 ? "round-winner" : ""}">
          <span class="played-by">${maquinaAbre ? "MÁQUINA · ABRE" : "MÁQUINA"}</span>
          <img src="${imagenCarta(cartaMaquina)}"
            alt="${escapeHtml(nombreCarta(cartaMaquina))}"
            onerror="this.style.display='none';this.nextElementSibling.hidden=false">
          <span class="card-fallback" hidden>${escapeHtml(nombreCarta(cartaMaquina))}</span>
          <span class="played-name">${escapeHtml(nombreCarta(cartaMaquina))}</span>
        </div>
      `;

      $("#tableArea").innerHTML = maquinaAbre
        ? jugadaMaquina + jugadaJugador
        : jugadaJugador + jugadaMaquina;
    }

    function prepararRonda() {
      if (empieza === -1) {
        revelarCartaMaquina(ronda);

        const carta = maquina[ronda];

        $("#tableArea").innerHTML = `
          <div class="played-card">
            <span class="played-by">MÁQUINA · ABRE</span>
            <img src="${imagenCarta(carta)}"
              alt="${escapeHtml(nombreCarta(carta))}"
              onerror="this.style.display='none';this.nextElementSibling.hidden=false">
            <span class="card-fallback" hidden>${escapeHtml(nombreCarta(carta))}</span>
            <span class="played-name">${escapeHtml(nombreCarta(carta))}</span>
          </div>
          <p class="helper">La máquina abrió. Elegí tu carta para responder.</p>
        `;

        $("#machineGameStatus").textContent =
          `Ronda ${ronda + 1}: empieza la máquina. Ahora te toca responder.`;
      } else {
        $("#tableArea").innerHTML =
          '<p class="helper">Vos abrís la ronda. Elegí una carta.</p>';

        $("#machineGameStatus").textContent =
          `Ronda ${ronda + 1}: empezás vos. Elegí una carta.`;
      }
    }

    function jugarCarta(indice) {
      if (terminada || botones[indice].disabled) return;

      const cartaJugador = jugador[indice];
      if (!cartaJugador) return;

      const cartaMaquina = maquina[ronda];
      const maquinaAbre = empieza === -1;
      const resultado = resultadoRonda(cartaJugador, cartaMaquina);

      resultados.push(resultado);

      jugador[indice] = null;
      botones[indice].disabled = true;
      botones[indice].classList.add("card-played");

      if (!maquinaAbre) {
        revelarCartaMaquina(ronda);
      }

      mostrarMesa(cartaJugador, cartaMaquina, resultado, maquinaAbre);

      const resultadoTexto =
        resultado === 1 ? "Ganaste esta ronda." :
        resultado === -1 ? "La máquina ganó esta ronda." :
        "Ronda empatada.";

      $("#roundResult").textContent =
        `Ronda ${ronda + 1} de 3: ${resultadoTexto}`;

      // El ganador de la ronda abre la siguiente.
      // Si hay empate, conserva la salida quien había abierto.
      if (resultado === 1) empieza = 1;
      if (resultado === -1) empieza = -1;

      ronda++;

      if (ronda >= 3) {
        terminada = true;

        const ganador = ganadorMano(resultados);
        let mensaje;

        if (ganador === 1) {
          game.nosotros = Math.min(30, game.nosotros + 1);
          mensaje = "¡Ganaste la mano! Sumás 1 punto.";
        } else if (ganador === -1) {
          game.ellos = Math.min(30, game.ellos + 1);
          mensaje = "La máquina ganó la mano. Suma 1 punto.";
        } else {
          mensaje = "La mano terminó empatada. Nadie suma puntos.";
        }

        $("#machinePlayerScore").textContent = game.nosotros;
        $("#machineOpponentScore").textContent = game.ellos;

        const partidaCompleta = game.nosotros >= 30 || game.ellos >= 30;

        $("#handResult").innerHTML = `
          <div class="hand-result-panel">
            <strong>${mensaje}</strong>
            <p class="helper">
              Resultado: Vos ${game.nosotros} — Máquina ${game.ellos}
            </p>
            ${partidaCompleta ? `
              <h3>¡${game.nosotros >= 30 ? "Ganaste" : "La máquina ganó"} la partida!</h3>
            ` : ""}
          </div>
        `;

        $("#machineGameStatus").textContent = "Mano terminada.";
        botones.forEach(b => { b.disabled = true; });

        $("#newDealButton").hidden = partidaCompleta;
        $("#newMatchButton").hidden = !partidaCompleta;
      } else {
        prepararRonda();
      }
    }

    botones.forEach(boton => {
      boton.addEventListener("click", () => {
        jugarCarta(Number(boton.dataset.card));
      });
    });

    $("#newDealButton").addEventListener("click", repartir);

    $("#newMatchButton").addEventListener("click", () => {
      game.nosotros = 0;
      game.ellos = 0;

      // Alternar el jugador que empieza la próxima partida.
      empiezaPrimeraMano *= -1;

      renderGame();
    });

    prepararRonda();
  }

  renderGame();
}

// ======================================================
// NAVEGACIÓN Y ANOTADOR
// ======================================================

$("#backButton").addEventListener("click", showPlay);
$("#backLink").addEventListener("click", showPlay);

$("#profileButton").addEventListener("click", () => {
  showToast("El perfil y el registro se implementarán en otra etapa.");
});

function renderScoreSticks(points) {
  const groups = Math.floor(points / 5);
  const remainder = points % 5;
  let html = "";

  for (let i = 0; i < groups; i++) {
    html += `
      <div class="stick-group complete" aria-label="Cinco puntos">
        <span class="stick"></span><span class="stick"></span>
        <span class="stick"></span><span class="stick"></span>
        <span class="stick"></span>
      </div>
    `;
  }

  if (remainder > 0) {
    html += `<div class="stick-group" aria-label="${remainder} puntos">`;
    for (let i = 0; i < remainder; i++) {
      html += `<span class="stick"
        style="transform:rotate(${(i - (remainder - 1) / 2) * 27}deg)"></span>`;
    }
    html += `</div>`;
  }

  return html || '<span class="helper">Todavía sin puntos</span>';
}

function openScoreboard() {
  const scores = { nosotros: 0, ellos: 0 };

  function drawScoreboard() {
    detailContent.innerHTML = `
      <div class="scoreboard">
        ${["nosotros", "ellos"].map(team => `
          <section class="score-team">
            <h3>${team === "nosotros" ? "NOSOTROS" : "ELLOS"}</h3>
            <div class="score-number">${scores[team]}</div>
            <div class="matchsticks">${renderScoreSticks(scores[team])}</div>
            <div class="score-buttons">
              <button class="score-minus" data-score="${team}" data-delta="-1"
                ${scores[team] === 0 ? "disabled" : ""}>− 1</button>
              <button class="score-plus" data-score="${team}" data-delta="1"
                ${scores[team] === 30 || scores.nosotros === 30 || scores.ellos === 30
                  ? "disabled" : ""}>+ 1 punto</button>
            </div>
          </section>
        `).join("")}
      </div>

      ${scores.nosotros === 30 || scores.ellos === 30
        ? `<div class="score-finished">
            ¡Ganó ${scores.nosotros === 30 ? "NOSOTROS" : "ELLOS"}!
          </div>` : ""}

      <button class="secondary-button score-reset" id="resetScore">
        Reiniciar partido
      </button>
    `;

    detailContent.querySelectorAll("[data-score]").forEach(button => {
      button.addEventListener("click", () => {
        const team = button.dataset.score;
        const delta = Number(button.dataset.delta);

        if (delta > 0 && (scores.nosotros === 30 || scores.ellos === 30)) return;

        scores[team] = Math.max(0, Math.min(30, scores[team] + delta));
        drawScoreboard();
      });
    });

    $("#resetScore").addEventListener("click", () => {
      scores.nosotros = 0;
      scores.ellos = 0;
      drawScoreboard();
    });
  }

  playScreen.hidden = true;
  detailScreen.hidden = false;
  backButton.hidden = false;

  $("#detailEyebrow").textContent = "TRUCO ARGENTINO";
  $("#detailTitle").textContent = "Anotador";
  $("#detailDescription").textContent = "Marcá los puntos de cada equipo hasta 30.";

  drawScoreboard();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$("[data-nav]").forEach(button => {
  button.addEventListener("click", () => {
    const page = button.dataset.nav;

    $$(".nav-item").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    if (page === "play") showPlay();
    if (page === "score") openScoreboard();
    if (page === "rules") {
      showToast("Las reglas del truco se agregarán en otra etapa.");
    }
  });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
