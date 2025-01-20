const canvas = document.getElementById("board");
const context = canvas.getContext("2d");
const rollDiceButton = document.getElementById("roll-dice");
const diceResult = document.getElementById("dice-result");

const socket = io();

function drawBoard() {
  context.fillStyle = "#FFD700";
  context.fillRect(0, 0, canvas.width, canvas.height);
  // ציור הלוח והכלים כאן
}

function rollDice() {
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  diceResult.textContent = `You rolled: ${dice1} and ${dice2}`;
  socket.emit("rollDice", { dice1, dice2 });
}

rollDiceButton.addEventListener("click", rollDice);

socket.on("rollDice", (data) => {
  diceResult.textContent = `Opponent rolled: ${data.dice1} and ${data.dice2}`;
});

drawBoard();
