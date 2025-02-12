const socket = io();
const diceResult = document.getElementById("dice-result");
const rollDiceButton = document.getElementById("roll-dice");
const turnIndicator = document.getElementById("turn-indicator");
const timerDisplay = document.getElementById("timer");

let gameData = {
  player: null,
  opponent: null,
  turn: null,
  dice: [],
  timer: 120,
  interval: null,
};

// התחלת משחק
socket.emit("joinGame");

// קבלת מידע על המשחק
socket.on("gameState", (data) => {
  gameData = { ...gameData, ...data };
  updateUI();
});

// עדכון תור
socket.on("turnUpdate", (turn) => {
  gameData.turn = turn;
  resetTimer();
  updateUI();
});

// גלגול קוביות
rollDiceButton.addEventListener("click", () => {
  socket.emit("rollDice");
});

// קבלת תוצאות קוביות
socket.on("diceRolled", (dice) => {
  gameData.dice = dice;
  diceResult.textContent = `Dice: ${dice[0]} & ${dice[1]}`;
});

// עדכון טיימר
function resetTimer() {
  clearInterval(gameData.interval);
  gameData.timer = 120;
  gameData.interval = setInterval(() => {
    gameData.timer--;
    timerDisplay.textContent = `Time left: ${gameData.timer}s`;
    if (gameData.timer <= 0) {
      socket.emit("playerTimeout");
      clearInterval(gameData.interval);
    }
  }, 1000);
}

// עדכון UI
function updateUI() {
  turnIndicator.textContent =
    gameData.turn === gameData.player ? "Your Turn" : "Opponent's Turn";
  rollDiceButton.disabled = gameData.turn !== gameData.player;
}
