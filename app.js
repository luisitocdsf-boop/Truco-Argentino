const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const playScreen = $("#playScreen");
const detailScreen = $("#detailScreen");
const detailContent = $("#detailContent");
const backButton = $("#backButton");
const toast = $("#toast");
let selectedMode = "2 vs 2";
let toastTimer;

function showToast(message) {
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
  return `<span class="field-label">Modo de juego</span>
    <div class="chip-row">
      ${["1 vs 1","2 vs 2","3 vs 3"].map(mode => `<button class="chip ${mode===defaultMode?"selected":""}" type="button" data-pick-mode="${mode}">${mode}</button>`).join("")}
    </div>`;
}
function attachModePicker() {
  $$("[data-pick-mode]").forEach(button => button.addEventListener("click", () => {
    selectedMode = button.dataset.pickMode;
    $$("[data-pick-mode]").forEach(b => b.classList.toggle("selected", b === button));
  }));
}
function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i=0;i<6;i++) code += chars[Math.floor(Math.random()*chars.length)];
  return code;
}
function createRoom() {
  selectedMode = "2 vs 2";
  showDetail("SALA PRIVADA", "Creá tu mesa", "Elegí el formato y generá un código para compartir.", `
    ${modePicker()}
    <label class="field-label" for="nickname">Tu apodo</label>
    <input class="text-input" id="nickname" maxlength="18" placeholder="Ej. ElMano" autocomplete="nickname">
    <button class="primary-button" id="makeRoomButton">Crear sala y generar código</button>
    <p class="helper">En esta versión de prueba, el código se genera en tu dispositivo. Todavía no crea una sala online real.</p>
    <div id="roomResult"></div>`);
  attachModePicker();
  $("#makeRoomButton").addEventListener("click", () => {
    const nickname = $("#nickname").value.trim();
    if (!nickname) { showToast("Escribí un apodo para continuar."); $("#nickname").focus(); return; }
    const code = makeRoomCode();
    $("#roomResult").innerHTML = `<div class="room-code" id="generatedCode">${code}</div>
      <p class="helper">Modo: <strong>${selectedMode}</strong> · Anfitrión: <strong>${escapeHtml(nickname)}</strong></p>
      <button class="secondary-button" id="shareCodeButton">Compartir código</button>`;
    $("#shareCodeButton").addEventListener("click", async () => {
      const shareText = `¡Sumate a mi mesa de Truco Argentino! Código: ${code} · Modo: ${selectedMode}`;
      if (navigator.share) {
        try { await navigator.share({ title: "Sala de Truco Argentino", text: shareText }); }
        catch (error) { if (error.name !== "AbortError") showToast("No se pudo abrir el menú para compartir."); }
      } else if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(shareText); showToast("Código copiado para compartir."); }
        catch { showToast(shareText); }
      } else { showToast(shareText); }
    });
    showToast("Código generado. La sala online llegará en la próxima etapa.");
  });
}
function joinRoom() {
  showDetail("ENTRAR A UNA SALA", "¿Tenés un código?", "Pedile el código al amigo que creó la mesa.", `
    <label class="field-label" for="roomCodeInput">Código de sala</label>
    <input class="text-input" id="roomCodeInput" maxlength="6" placeholder="ABC123" autocapitalize="characters" autocomplete="off">
    <button class="primary-button" id="joinRoomButton">Continuar</button>
    <p class="helper">La validación online todavía no está conectada. Por ahora comprobamos que el formato del código sea correcto.</p>`);
  $("#roomCodeInput").addEventListener("input", e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,6); });
  $("#joinRoomButton").addEventListener("click", () => {
    const code = $("#roomCodeInput").value.trim();
    if (code.length !== 6) { showToast("El código debe tener 6 caracteres."); return; }
    showToast("Código con formato válido. Falta conectar las salas online.");
  });
}
function publicMatch() {
  selectedMode = "2 vs 2";
  showDetail("PARTIDA PÚBLICA", "Buscá una mesa", "Elegí el modo que preferís para jugar con otros.", `
    ${modePicker()}
    <button class="primary-button" id="searchButton">Buscar partida</button>
    <div id="searchResult"></div>
    <p class="helper">El emparejamiento público necesita un servidor. Este botón muestra el flujo de prueba, sin conectarte con jugadores reales.</p>`);
  attachModePicker();
  $("#searchButton").addEventListener("click", () => {
    $("#searchResult").innerHTML = `<div class="detail-panel" style="margin-top:14px;text-align:center">
      <div style="font-size:30px;color:var(--gold-light);margin-bottom:8px">⌕</div>
      <strong>Modo seleccionado: ${selectedMode}</strong>
      <p class="helper">Todavía no hay conexión con un servidor de partidas.</p>
      <button class="secondary-button" id="cancelSearch">Cancelar búsqueda</button>
    </div>`;
    $("#cancelSearch").addEventListener("click", () => { $("#searchResult").innerHTML = ""; showToast("Búsqueda de prueba cancelada."); });
  });
}
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}

$$("[data-mode]").forEach(button => button.addEventListener("click", () => {
  selectedMode = button.dataset.mode;
  showDetail("MODO DE JUEGO", selectedMode, "Elegí cómo querés armar la partida.", `
    <div class="detail-panel" style="text-align:center;border:0;padding:6px 0 14px;background:transparent">
      <div style="font-size:45px;color:var(--gold-light)">♠</div>
      <strong>${selectedMode}</strong>
      <p class="helper">Podés crear una sala privada o buscar una partida pública con este modo.</p>
    </div>
    <button class="primary-button" id="privateWithMode">Crear sala privada</button>
    <button class="secondary-button" id="publicWithMode">Buscar partida pública</button>`);
  $("#privateWithMode").addEventListener("click", createRoom);
  $("#publicWithMode").addEventListener("click", publicMatch);
}));
$("#createRoom").addEventListener("click", createRoom);
$("#joinRoom").addEventListener("click", joinRoom);
$("#publicMatch").addEventListener("click", publicMatch);

$("#playVsMachine").addEventListener("click", startMachineGame);

function startMachineGame() {
  showDetail(
    "PARTIDA CONTRA LA MÁQUINA",
    "¡A jugar al truco!",
    "Modo 1 contra 1 · Dificultad normal",
    `
      <div class="detail-panel" style="text-align:center">
        <p>La partida se está preparando.</p>
        <p class="helper">En el próximo paso agregaremos la baraja, el reparto de cartas y las jugadas.</p>
        <button class="primary-button" id="dealCardsButton">Repartir cartas</button>
      </div>
    `
  );

  $("#dealCardsButton").addEventListener("click", () => {
    showToast("¡Ya podemos preparar el reparto de cartas!");
  });
}

$("#backButton").addEventListener("click", showPlay);
$("#backLink").addEventListener("click", showPlay);
$("#profileButton").addEventListener("click", () => showToast("El perfil y el registro se implementarán en la siguiente etapa."));

function renderScoreSticks(points) {
  const groups = Math.floor(points / 5);
  const remainder = points % 5;
  let html = "";

  for (let i = 0; i < groups; i++) {
    html += `<div class="stick-group complete" aria-label="Cinco puntos">
      <span class="stick"></span><span class="stick"></span>
      <span class="stick"></span><span class="stick"></span>
      <span class="stick"></span>
    </div>`;
  }

  if (remainder > 0) {
    html += `<div class="stick-group" aria-label="${remainder} puntos">`;
    for (let i = 0; i < remainder; i++) {
      html += `<span class="stick" style="transform:rotate(${(i - (remainder - 1) / 2) * 27}deg)"></span>`;
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
              <button class="score-minus" data-score="${team}" data-delta="-1" ${scores[team] === 0 ? "disabled" : ""}>− 1</button>
              <button class="score-plus" data-score="${team}" data-delta="1" ${scores[team] === 30 || scores.nosotros === 30 || scores.ellos === 30 ? "disabled" : ""}>+ 1 punto</button>
            </div>
          </section>
        `).join("")}
      </div>
      ${scores.nosotros === 30 || scores.ellos === 30
        ? `<div class="score-finished">¡Ganó ${scores.nosotros === 30 ? "NOSOTROS" : "ELLOS"}!</div>`
        : ""}
      <button class="secondary-button score-reset" id="resetScore">Reiniciar partido</button>
    `;

    detailContent.querySelectorAll("[data-score]").forEach(button => {
      button.addEventListener("click", () => {
        const team = button.dataset.score;
        const delta = Number(button.dataset.delta);
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

$$("[data-nav]").forEach(button => button.addEventListener("click", () => {
  const page = button.dataset.nav;
  $$(".nav-item").forEach(item => item.classList.toggle("active", item === button));

  if (page === "play") showPlay();
  if (page === "score") openScoreboard();
  if (page === "rules") showToast("Las reglas del truco se agregarán en la siguiente etapa.");
}));


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
