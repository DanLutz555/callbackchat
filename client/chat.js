const socket = io();
const usersList = document.getElementById("users");
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send-button");
const logoutButton = document.getElementById("logout-button");

// פענוח הטוקן כדי לקבל את מזהה המשתמש ואת המייל
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
    users.forEach((user) => {
      const li = document.createElement("li");
      li.textContent =
        user.email + (user.isConnected ? " (Online)" : " (Offline)");
      usersList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

async function fetchMessages() {
  try {
    const response = await fetch("http://localhost:3000/messages");
    const messages = await response.json();
    chatBox.innerHTML = "";
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
fetchMessages();

socket.on("connect", () => {
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

  if (message && token) {
    socket.emit("chatMessage", { content: message, token });
    chatBox.innerHTML += `<div class="message">You: ${message}</div>`;
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
