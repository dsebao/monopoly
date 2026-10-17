// Variables globales
let players = [];
let bankBalance = 20000;

// Colores de los títulos de propiedad: [fondo, texto]
const DEED_COLORS = [
  ["#955436", "#fff"], ["#aae0fa", "#1b1b1b"], ["#d93a96", "#fff"], ["#f7941d", "#1b1b1b"],
  ["#ed1b24", "#fff"], ["#fef200", "#1b1b1b"], ["#1fb25a", "#fff"], ["#0072bb", "#fff"],
];

// Sonido de monedas sintetizado con Web Audio (sin archivos)
let audioCtx;
function playCoins() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    // Varias monedas cayendo: cada una con parciales inarmónicos metálicos
    for (let i = 0; i < 5; i++) {
      const t = now + i * 0.06 + Math.random() * 0.03;
      const base = 1800 + Math.random() * 900;
      [1, 2.76, 5.4].forEach((ratio, k) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = base * ratio;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18 / (k + 1), t + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25 - k * 0.06);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    }
  } catch (e) {
    // Sin soporte de audio: la operación sigue igual
  }
}

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

function showGame() {
  document.getElementById("gameArea").style.display = "block";
  document.getElementById("resetGame").style.display = "inline-block";
  document.querySelector(".settings").style.display = "none";
}

// Función para inicializar el juego
function initializeGame(playerCount) {
  const bankBalanceElement = document.getElementById("bankBalance");

  if (!(playerCount >= 2 && playerCount <= 8)) {
    alert("Ingrese entre 2 y 8 jugadores.");
    return false;
  }

  // Restar el dinero inicial asignado a los jugadores del banco
  const initialPlayerMoney = 1500 * playerCount;
  if (bankBalance < initialPlayerMoney) {
    alert("El banco no tiene suficiente dinero para asignar a los jugadores.");
    return false;
  }
  bankBalance -= initialPlayerMoney;
  bankBalanceElement.textContent = fmt(bankBalance);

  for (let i = 1; i <= playerCount; i++) {
    players.push({ id: i, name: `Jugador ${i}`, balance: 1500 });
  }

  // Guardar datos iniciales en localStorage
  saveGameState();
  playCoins();

  renderPlayers();
  showGame();
  return true;
}

// Función para renderizar las tarjetas de los jugadores
function renderPlayers() {
  const playerGrid = document.getElementById("playerGrid");
  playerGrid.innerHTML = "";

  players.forEach((player) => {
    const playerCard = document.createElement("div");
    const [deed, ink] = DEED_COLORS[(player.id - 1) % DEED_COLORS.length];
    playerCard.className = "player-card";
    playerCard.style.cssText = `--deed:${deed};--deed-ink:${ink};--tilt:${((player.id * 7) % 5) - 2}deg`;
    playerCard.innerHTML = `
      <div class="name_player">
        <small>Título de propiedad</small>
        <h4 id="player-name-${player.id}">${player.name}</h4>
      </div>
      <p class="money"><small>Saldo</small>$<span id="balance-${player.id}">${fmt(player.balance)}</span></p>
      <div class="actions">
        <div class="input">
          <input type="number" id="amount-${player.id}" placeholder="Cantidad" min="1" inputmode="numeric">
          <div class="buttons">
            <button class="chip add" onclick="addMoney(${player.id})" title="Cobrar del banco" aria-label="Cobrar del banco">+</button>
            <button class="chip minus" onclick="subtractMoney(${player.id})" title="Pagar al banco" aria-label="Pagar al banco">−</button>
          </div>
        </div>
        <div class="transfer">
          <select id="transfer-to-${player.id}">
              <option value="">¿A quién?</option>
              ${players
                .filter((p) => p.id !== player.id)
                .map((p) => `<option value="${p.id}">${p.name}</option>`)
                .join("")}
          </select>
          <button class="btn btn-green" onclick="transferMoney(${player.id})">Transferir</button>
        </div>
      </div>
      <div class="rename" id="rename-container-${player.id}" style="display: ${
      player.name !== `Jugador ${player.id}` ? "none" : "flex"
    };">
        <input type="text" id="name-input-${player.id}" placeholder="Nuevo nombre">
        <button class="btn btn-dark" onclick="changePlayerName(${player.id})">Cambiar</button>
      </div>
    `;
    playerGrid.appendChild(playerCard);
  });
}

// Función para agregar dinero a un jugador desde el banco
function addMoney(playerId) {
  const amountInput = document.getElementById(`amount-${playerId}`);
  const amount = parseInt(amountInput.value);
  if (isNaN(amount) || amount <= 0) {
    alert("Por favor, ingrese una cantidad válida.");
    return;
  }
  if (bankBalance < amount) {
    alert("El banco no tiene suficiente dinero.");
    return;
  }
  const player = players.find((p) => p.id === playerId);
  player.balance += amount;
  bankBalance -= amount;
  updateUI(playerId);
  saveGameState();
  playCoins();
  amountInput.value = ""; // Resetear el input
}

// Función para restar dinero a un jugador y devolverlo al banco
function subtractMoney(playerId) {
  const amountInput = document.getElementById(`amount-${playerId}`);
  const amount = parseInt(amountInput.value);
  if (isNaN(amount) || amount <= 0) {
    alert("Por favor, ingrese una cantidad válida.");
    return;
  }
  const player = players.find((p) => p.id === playerId);
  if (player.balance < amount) {
    alert("El jugador no tiene suficiente dinero.");
    return;
  }
  player.balance -= amount;
  bankBalance += amount;
  updateUI(playerId);
  saveGameState();
  playCoins();
  amountInput.value = ""; // Resetear el input
}

// Función para transferir dinero entre jugadores
function transferMoney(fromPlayerId) {
  const amountInput = document.getElementById(`amount-${fromPlayerId}`);
  const transferToSelect = document.getElementById(`transfer-to-${fromPlayerId}`);
  const amount = parseInt(amountInput.value);
  const toPlayerId = parseInt(transferToSelect.value);

  if (isNaN(amount) || amount <= 0) {
    alert("Por favor, ingrese una cantidad válida.");
    return;
  }
  if (!toPlayerId) {
    alert("Por favor, seleccione un jugador para transferir el dinero.");
    return;
  }

  const fromPlayer = players.find((p) => p.id === fromPlayerId);
  const toPlayer = players.find((p) => p.id === toPlayerId);

  if (fromPlayer.balance < amount) {
    alert("El jugador no tiene suficiente dinero para transferir.");
    return;
  }

  fromPlayer.balance -= amount;
  toPlayer.balance += amount;

  updateUI(fromPlayerId);
  updateUI(toPlayerId);
  saveGameState();
  playCoins();

  amountInput.value = ""; // Resetear el input
  transferToSelect.value = ""; // Resetear el selector
}

// Función para cambiar el nombre de un jugador
function changePlayerName(playerId) {
  const newName = document.getElementById(`name-input-${playerId}`).value.trim();
  if (newName) {
    const player = players.find((p) => p.id === playerId);
    player.name = newName;
    saveGameState();
    // Re-render para actualizar los selectores de transferencia de todos
    renderPlayers();
  } else {
    alert("Por favor, ingrese un nombre válido.");
  }
}

// Función para actualizar la interfaz de usuario
function updateUI(playerId) {
  const player = players.find((p) => p.id === playerId);
  document.getElementById(`player-name-${player.id}`).textContent = player.name;
  document.getElementById(`balance-${player.id}`).textContent = fmt(player.balance);
  document.getElementById("bankBalance").textContent = fmt(bankBalance);
}

// Función para guardar el estado del juego en localStorage
function saveGameState() {
  localStorage.setItem("players", JSON.stringify(players));
  localStorage.setItem("bankBalance", bankBalance);
}

// Función para cargar el estado del juego desde localStorage
function loadGameState() {
  const savedPlayers = JSON.parse(localStorage.getItem("players"));
  const savedBankBalance = localStorage.getItem("bankBalance");

  if (savedPlayers && savedBankBalance) {
    players = savedPlayers;
    bankBalance = parseInt(savedBankBalance);
    renderPlayers();
    document.getElementById("bankBalance").textContent = fmt(bankBalance);
    showGame();
  }
}

// Función para reiniciar el juego
function resetGame() {
  localStorage.clear();
  location.reload();
}

// Event listeners
document.getElementById("startGame").addEventListener("click", () => {
  const playerCount = parseInt(document.getElementById("playerCount").value);
  initializeGame(playerCount);
});

document.getElementById("resetGame").addEventListener("click", resetGame);

// Cargar datos desde localStorage al iniciar
window.addEventListener("load", loadGameState);
