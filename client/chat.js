const socket = io();
const usersList = document.getElementById("users");
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send-button");
const logoutButton = document.getElementById("logout-button");
let currentRoom = null;

function decodeToken(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
  return JSON.parse(jsonPayload);
}

async function fetchConnectedUsers() {
  try {
    const response = await fetch("http://localhost:3000/users");
    const users = await response.json();
    usersList.innerHTML = "";
    // קבלת המשתמש הנוכחי מטוקן
    const token = localStorage.getItem("token");
    const currentUser = token ? decodeToken(token).email : null;

    users.forEach((user) => {
      const li = document.createElement("li");
      li.innerHTML = `<div class="status"></div>${user.email}`;
      li.dataset.email = user.email;

      // הוספת סטייל לפי חיבור
      li.classList.add(user.isConnected ? "online" : "offline");

      // אם המשתמש הוא המשתמש הנוכחי, אין להוסיף אירוע לחיצה
      if (user.email === currentUser) {
        li.classList.add("self");
        li.style.cursor = "default";
        // ניתן להוסיף טקסט קטן לציון "You" (אופציונלי)
        li.innerHTML += " (You)";
      } else {
        // בלחיצה נפתח צ'אט פרטי
        li.style.cursor = "pointer";
        li.addEventListener("click", () => {
          startPrivateChat(user.email);
        });
      }

      // אם המשתמש מחובר (ומאינו עצמך) – הוספת כפתור משחק
      if (user.isConnected && user.email !== currentUser) {
        const gameButton = document.createElement("button");
        gameButton.textContent = "Play Backgammon";
        gameButton.className = "game-button";
        gameButton.addEventListener("click", (e) => {
          e.stopPropagation(); // לא להפעיל את אירוע הצ'אט
          inviteToBackgammon(user.email);
        });
        li.appendChild(gameButton);
      }

      usersList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

function inviteToBackgammon(opponentEmail) {
  window.open(
    `backgammon.html?opponent=${encodeURIComponent(opponentEmail)}`,
    "_blank",
    "width=800,height=600"
  );
}

function startPrivateChat(targetEmail) {
  const token = localStorage.getItem("token");
  if (!token) return;
  const currentUser = decodeToken(token).email;

  // מניעת פתיחת צ'אט עם עצמך
  if (currentUser === targetEmail) {
    alert("You cannot send a message to yourself.");
    return;
  }

  chatBox.innerHTML = "";
  // יצירת שם חדר ייחודי לפי שני המשתמשים – מיון על מנת ששני הצדדים יצטרפו לאותו חדר
  const roomName = ["private", ...[currentUser, targetEmail].sort()].join("_");
  socket.emit("joinRoom", roomName);
  currentRoom = roomName;

  // הוספת כותרת המציגה עם מי מדברים
  const header = document.createElement("h3");
  header.textContent = `Private Chat with ${targetEmail}`;
  chatBox.appendChild(header);

  fetchPrivateMessages(roomName);
}

async function fetchPrivateMessages(roomName) {
  try {
    const response = await fetch(`http://localhost:3000/messages/${roomName}`);
    const messages = await response.json();
    messages.forEach((message) => {
      const messageElement = document.createElement("div");
      messageElement.className = "message";
      messageElement.textContent = `${message.sender.email}: ${message.content}`;
      chatBox.appendChild(messageElement);
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
}

fetchConnectedUsers();

socket.on("connect", () => {
  const token = localStorage.getItem("token");
  const user = decodeToken(token);
  socket.emit("joinRoom", user.email);
  console.log("Connected to server");
});

messageInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

sendButton.addEventListener("click", () => {
  sendMessage();
});

function sendMessage() {
  const message = messageInput.value;
  const token = localStorage.getItem("token");

  if (message && token && currentRoom) {
    socket.emit("chatMessage", { content: message, token, room: currentRoom });
    messageInput.value = "";
  }
}

logoutButton.addEventListener("click", async () => {
  try {
    const email = localStorage.getItem("email");
    const response = await fetch("http://localhost:3000/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    socket.emit("userDisconnected", email);
    window.location.href = "sign-in.html";
  } catch (error) {
    console.error("There was a problem with your logout operation:", error);
  }
});

socket.on("chatMessage", (data) => {
  const { content, sender } = data;
  const messageElement = document.createElement("div");
  messageElement.className = "message";
  messageElement.textContent = `${sender}: ${content}`;
  chatBox.appendChild(messageElement);
});

socket.on("userStatusUpdate", (data) => {
  fetchConnectedUsers();
});

socket.on("systemMessage", (data) => {
  const messageElement = document.createElement("div");
  messageElement.className = "system-message";
  messageElement.textContent = data.message;
  chatBox.appendChild(messageElement);
});
