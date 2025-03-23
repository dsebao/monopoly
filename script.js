// Variables globales
let players = [];
let bankBalance = 20000;

// Función para inicializar el juego
function initializeGame(playerCount) {
  const gameArea = document.getElementById("gameArea");
  const playerGrid = document.getElementById("playerGrid");
  const bankBalanceElement = document.getElementById("bankBalance");
  const resetGameButton = document.getElementById("resetGame");

  // Restar el dinero inicial asignado a los jugadores del banco
  const initialPlayerMoney = 1500 * playerCount;
  if (bankBalance < initialPlayerMoney) {
    alert("El banco no tiene suficiente dinero para asignar a los jugadores.");
    return false;
  }
  bankBalance -= initialPlayerMoney;
  bankBalanceElement.textContent = bankBalance;

  for (let i = 1; i <= playerCount; i++) {
    players.push({ id: i, name: `Jugador ${i}`, balance: 1500 });
  }

  // Guardar datos iniciales en localStorage
  saveGameState();

  gameArea.style.display = "block";
  resetGameButton.style.display = "block";
  playerGrid.innerHTML = "";

  renderPlayers();
  return true;
}

// Función para renderizar las tarjetas de los jugadores
function renderPlayers() {
  const playerGrid = document.getElementById("playerGrid");
  playerGrid.innerHTML = "";

  players.forEach((player) => {
    const playerCard = document.createElement("div");
    playerCard.className = "player-card";
    playerCard.innerHTML = `
      <div class="name_player">
        <h4 id="player-name-${player.id}">${player.name}</h4>
      </div>
      <p class="money">$<span id="balance-${player.id}">${player.balance}</span></p>
      <div class="actions">
        <div class="input">
          <input type="number" id="amount-${player.id}" placeholder="Cantidad">
          <div class="buttons">
            <button class="add" onclick="addMoney(${player.id})">+</button>
            <button class="minus" onclick="subtractMoney(${player.id})">-</button>
          </div>
        </div>
        <div class="transfer">
          <select id="transfer-to-${player.id}">
              <option value="">Seleccionar jugador</option>
              ${players
                .filter((p) => p.id !== player.id)
                .map((p) => `<option value="${p.id}">${p.name}</option>`)
                .join("")}
          </select>
          <button onclick="transferMoney(${player.id})">Transferir</button>
        </div>
      </div>
      <div class="rename" id="rename-container-${player.id}" style="display: ${
      player.name !== `Jugador ${player.id}` ? "none" : "flex"
    };">
        <input type="text" id="name-input-${player.id}" placeholder="Nuevo nombre">
        <button onclick="changePlayerName(${player.id})">Cambiar</button>
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

  amountInput.value = ""; // Resetear el input
  transferToSelect.value = ""; // Resetear el selector
}

// Función para cambiar el nombre de un jugador
function changePlayerName(playerId) {
  const newName = document.getElementById(`name-input-${playerId}`).value.trim();
  if (newName) {
    const player = players.find((p) => p.id === playerId);
    player.name = newName;
    updateUI(playerId);
    saveGameState();

    // Ocultar la opción de cambiar nombre
    document.getElementById(`rename-container-${playerId}`).style.display = "none";
  } else {
    alert("Por favor, ingrese un nombre válido.");
  }
}

// Función para actualizar la interfaz de usuario
function updateUI(playerId) {
  const player = players.find((p) => p.id === playerId);
  document.getElementById(`player-name-${player.id}`).textContent = player.name;
  document.getElementById(`balance-${player.id}`).textContent = player.balance;
  document.getElementById("bankBalance").textContent = bankBalance;
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
    document.getElementById("bankBalance").textContent = bankBalance;
    document.getElementById("gameArea").style.display = "block";
    document.getElementById("resetGame").style.display = "block";
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
  if (initializeGame(playerCount)) {
    renderPlayers();
  }
});

document.getElementById("resetGame").addEventListener("click", resetGame);

// Cargar datos desde localStorage al iniciar
window.addEventListener("load", loadGameState);
