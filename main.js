const firebaseConfig = {
    apiKey: "AIzaSyAtBtbkMc7SSPtr-d-6Ys6sAjZ1_aniZUA",
    authDomain: "friends-chat-6afd0.firebaseapp.com",
    databaseURL: "https://friends-chat-6afd0-default-rtdb.firebaseio.com",
    projectId: "friends-chat-6afd0",
    storageBucket: "friends-chat-6afd0.firebasestorage.app",
    messagingSenderId: "466316077164",
    appId: "1:466316077164:web:b6b3410ebad340df219049"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const SECRET_ROOM_CODE = "12345";
const DEFAULT_ROOMS = ["عامة", "ألعاب", "ميمز"];

const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const usernameInput = document.getElementById("username-input");
const roomCodeInput = document.getElementById("room-code-input");
const joinBtn = document.getElementById("join-btn");
const loginError = document.getElementById("login-error");
const currentUserBadge = document.getElementById("current-user-badge");
const roomsListEl = document.getElementById("rooms-list");
const newRoomInput = document.getElementById("new-room-input");
const newRoomPass = document.getElementById("new-room-pass");
const addRoomBtn = document.getElementById("add-room-btn");
const onlineUsersList = document.getElementById("online-users-list");
const messagesContainer = document.getElementById("messages-container");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const imageBtn = document.getElementById("image-btn");
const imageInput = document.getElementById("image-input");
const soundToggle = document.getElementById("sound-toggle");
const themeToggle = document.getElementById("theme-toggle");
const logoutBtn = document.getElementById("logout-btn");

let currentUser = localStorage.getItem("chat_username") || "";
let currentRoom = localStorage.getItem("chat_room") || "عامة";
let soundEnabled = true;
let isSending = false;
let initialLoadComplete = false;
const renderedMessageIds = new Set();
let roomsMetaCache = {};

let activeMessagesRef = null;
let activeOnlineRef = null;
let activePresenceUserRef = null;

if (currentUser) {
    enterChat(currentUser);
}

joinBtn.addEventListener("click", () => {
    const name = usernameInput.value.trim();
    const code = roomCodeInput.value.trim();

    if (!name) {
        loginError.textContent = "يرجى كتابة اسمك أولاً.";
        return;
    }
    if (code !== SECRET_ROOM_CODE) {
        loginError.textContent = "الرمز السري غير صحيح!";
        return;
    }

    localStorage.setItem("chat_username", name);
    enterChat(name);
});

function enterChat(name) {
    currentUser = name;
    currentUserBadge.textContent = `متصل كـ: ${currentUser} • غرفة: ${currentRoom}`;
    loginScreen.classList.remove("active");
    chatScreen.classList.add("active");

    initRooms();
    switchRoom(currentRoom);
}

// 1. إدارة قائمة الغرف وإنشاء غرفة برمز سري اختياري
function initRooms() {
    const roomsRef = db.ref("rooms_meta");

    DEFAULT_ROOMS.forEach((roomName) => {
        const key = sanitizeRoomKey(roomName);
        roomsRef.child(key).once("value", (snap) => {
            if (!snap.exists()) {
                roomsRef.child(key).set({ name: roomName, password: "" });
            }
        });
    });

    roomsRef.on("value", (snapshot) => {
        roomsListEl.innerHTML = "";
        const data = snapshot.val() || {};
        roomsMetaCache = {};

        Object.entries(data).forEach(([key, roomObj]) => {
            if (!roomObj || !roomObj.name) return;
            roomsMetaCache[roomObj.name] = {
                key,
                name: roomObj.name,
                password: roomObj.password || ""
            };

            const isLocked = Boolean(roomObj.password);
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "room-btn" + (roomObj.name === currentRoom ? " active" : "");
            btn.textContent = `${isLocked ? "🔒" : "#"} ${roomObj.name}`;

            btn.addEventListener("click", () => {
                if (roomObj.name !== currentRoom) {
                    attemptSwitchRoom(roomObj.name);
                }
            });
            roomsListEl.appendChild(btn);
        });
    });
}

addRoomBtn.addEventListener("click", createNewRoom);
newRoomInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        createNewRoom();
    }
});
newRoomPass.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        createNewRoom();
    }
});

function createNewRoom() {
    const roomName = newRoomInput.value.trim();
    const roomPass = newRoomPass.value.trim();
    if (!roomName) return;

    const safeKey = sanitizeRoomKey(roomName);
    if (!safeKey) return;

    db.ref(`rooms_meta/${safeKey}`).set({
        name: roomName,
        password: roomPass
    }).then(() => {
        if (roomPass) {
            sessionStorage.setItem(`room_unlocked_${safeKey}`, "1");
        }
        newRoomInput.value = "";
        newRoomPass.value = "";
        switchRoom(roomName);
    });
}

function sanitizeRoomKey(name) {
    return name.replace(/[.#$/[\]]/g, "_").trim();
}

// التحقق من رمز الغرفة قبل الدخول إليها
function attemptSwitchRoom(roomName) {
    const meta = roomsMetaCache[roomName];
    const requiredPass = meta ? (meta.password || "") : "";
    const safeKey = sanitizeRoomKey(roomName);

    if (!requiredPass) {
        switchRoom(roomName);
        return;
    }

    if (sessionStorage.getItem(`room_unlocked_${safeKey}`) === "1") {
        switchRoom(roomName);
        return;
    }

    const enteredPass = prompt(`الغرفة "${roomName}" محمية برمز سري. أدخل الرمز:`);
    if (enteredPass === null) return;

    if (enteredPass.trim() === requiredPass) {
        sessionStorage.setItem(`room_unlocked_${safeKey}`, "1");
        switchRoom(roomName);
    } else {
        alert("رمز الغرفة غير صحيح!");
    }
}

// 2. التبديل بين الغرف
function switchRoom(roomName) {
    if (activePresenceUserRef) {
        activePresenceUserRef.onDisconnect().cancel();
        activePresenceUserRef.set(null);
    }
    if (activeMessagesRef) {
        activeMessagesRef.off();
    }
    if (activeOnlineRef) {
        activeOnlineRef.off();
    }

    currentRoom = roomName;
    localStorage.setItem("chat_room", currentRoom);
    currentUserBadge.textContent = `متصل كـ: ${currentUser} • غرفة: ${currentRoom}`;

    document.querySelectorAll(".room-btn").forEach((btn) => {
        const isActive = btn.textContent.endsWith(` ${currentRoom}`);
        btn.classList.toggle("active", isActive);
    });

    messagesContainer.innerHTML = "";
    renderedMessageIds.clear();
    initialLoadComplete = false;

    setupRoomPresence(currentUser, currentRoom);
    listenForRoomMessages(currentRoom);
}

// 3. المتصلون في الغرفة الحالية
function setupRoomPresence(username, roomName) {
    const safeRoom = sanitizeRoomKey(roomName);
    const connectedRef = db.ref(".info/connected");
    const userStatusRef = db.ref(`rooms/${safeRoom}/online_users/${username}`);
    activePresenceUserRef = userStatusRef;

    connectedRef.off();
    connectedRef.on("value", (snap) => {
        if (snap.val() === true && currentRoom === roomName) {
            userStatusRef.onDisconnect().remove();
            userStatusRef.set(true);
        }
    });

    activeOnlineRef = db.ref(`rooms/${safeRoom}/online_users`);
    activeOnlineRef.on("value", (snapshot) => {
        onlineUsersList.innerHTML = "";
        const users = snapshot.val();
        if (users) {
            Object.keys(users).forEach((user) => {
                const badge = document.createElement("span");
                badge.className = "online-badge";
                badge.textContent = user;
                onlineUsersList.appendChild(badge);
            });
        }
    });
}

// 4. إرسال رسالة نصية
messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (isSending) return;

    const text = messageInput.value.trim();
    if (!text) return;

    isSending = true;
    messageInput.value = "";

    const safeRoom = sanitizeRoomKey(currentRoom);
    db.ref(`rooms/${safeRoom}/messages`).push({
        sender: currentUser,
        type: "text",
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).finally(() => {
        isSending = false;
    });
});

// 5. اختيار وضغط وإرسال الصور
imageBtn.addEventListener("click", () => imageInput.click());

imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 600;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
            canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
            const safeRoom = sanitizeRoomKey(currentRoom);

            db.ref(`rooms/${safeRoom}/messages`).push({
                sender: currentUser,
                type: "image",
                imageUrl: compressedBase64,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    imageInput.value = "";
});

// 6. استقبال وحذف الرسائل
function listenForRoomMessages(roomName) {
    const safeRoom = sanitizeRoomKey(roomName);
    activeMessagesRef = db.ref(`rooms/${safeRoom}/messages`);

    setTimeout(() => { initialLoadComplete = true; }, 1500);

    activeMessagesRef.on("child_added", (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        displayMessage(snapshot.key, data);

        if (initialLoadComplete && data.sender !== currentUser && soundEnabled) {
            playNotificationSound();
        }
    });

    activeMessagesRef.on("child_removed", (snapshot) => {
        const msgId = snapshot.key;
        renderedMessageIds.delete(msgId);
        const msgElement = document.getElementById(`msg-${msgId}`);
        if (msgElement) {
            msgElement.remove();
        }
    });
}

function displayMessage(msgId, data) {
    if (!msgId || renderedMessageIds.has(msgId) || document.getElementById(`msg-${msgId}`)) {
        return;
    }

    renderedMessageIds.add(msgId);

    const isMine = data.sender === currentUser;
    const msgDiv = document.createElement("div");
    msgDiv.id = `msg-${msgId}`;
    msgDiv.classList.add("message", isMine ? "mine" : "other");

    let timeString = "";
    if (data.timestamp) {
        const date = new Date(data.timestamp);
        timeString = date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    }

    let contentHTML = "";
    if (data.type === "image") {
        contentHTML = `<img src="${data.imageUrl}" class="chat-image" onclick="window.open(this.src)" alt="صورة مرسلة">`;
    } else {
        contentHTML = `<p>${escapeHTML(data.text || "")}</p>`;
    }

    const deleteBtnHTML = isMine
        ? `<button class="delete-msg-btn" title="حذف الرسالة">🗑️</button>`
        : "";

    msgDiv.innerHTML = `
        ${!isMine ? `<span class="msg-sender">${escapeHTML(data.sender || "")}</span>` : ""}
        ${contentHTML}
        <div class="msg-footer">
            <span class="msg-time">${timeString}</span>
            ${deleteBtnHTML}
        </div>
    `;

    if (isMine) {
        const delBtn = msgDiv.querySelector(".delete-msg-btn");
        if (delBtn) {
            delBtn.addEventListener("click", () => {
                deleteMessage(msgId);
            });
        }
    }

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function deleteMessage(msgId) {
    if (!msgId) return;
    const safeRoom = sanitizeRoomKey(currentRoom);
    db.ref(`rooms/${safeRoom}/messages/${msgId}`).remove();
}

function playNotificationSound() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
}

soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? "🔔" : "🔕";
});

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("chat_theme", isDark ? "dark" : "light");
});

if (localStorage.getItem("chat_theme") === "dark") {
    document.body.classList.add("dark-mode");
}

logoutBtn.addEventListener("click", () => {
    if (currentUser && currentRoom) {
        const safeRoom = sanitizeRoomKey(currentRoom);
        db.ref(`rooms/${safeRoom}/online_users/${currentUser}`).set(null);
    }
    sessionStorage.clear();
    localStorage.removeItem("chat_username");
    location.reload();
});
