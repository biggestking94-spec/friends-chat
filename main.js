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
const auth = firebase.auth();
const db = firebase.database();

const DB_USERS_PATH = "v2_users";
const DB_ROOMS_META_PATH = "v2_rooms_meta";
const DB_ROOMS_DATA_PATH = "v2_rooms";

// شاشات وعناصر المصادقة واسم المستخدم
const authScreen = document.getElementById("auth-screen");
const usernameScreen = document.getElementById("username-screen");
const chatScreen = document.getElementById("chat-screen");

const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const emailLoginBtn = document.getElementById("email-login-btn");
const emailSignupBtn = document.getElementById("email-signup-btn");
const googleLoginBtn = document.getElementById("google-login-btn");
const githubLoginBtn = document.getElementById("github-login-btn");
const authError = document.getElementById("auth-error");

const setupUsernameInput = document.getElementById("setup-username-input");
const saveUsernameBtn = document.getElementById("save-username-btn");
const editUsernameBtn = document.getElementById("edit-username-btn");
const usernameError = document.getElementById("username-error");

// عناصر التطبيق الرئيسي
const waApp = document.querySelector(".wa-app");
const sidebarUsername = document.getElementById("sidebar-username");
const userAvatar = document.getElementById("user-avatar");
const currentRoomTitle = document.getElementById("current-room-title");
const roomAvatar = document.getElementById("room-avatar");
const backToRoomsBtn = document.getElementById("back-to-rooms-btn");

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

const micBtn = document.getElementById("mic-btn");
const recordingIndicator = document.getElementById("recording-indicator");

const soundToggle = document.getElementById("sound-toggle");
const themeToggle = document.getElementById("theme-toggle");
const logoutBtn = document.getElementById("logout-btn");

let authUser = null;
let currentUser = "";
let currentRoom = "";
let soundEnabled = true;
let isSending = false;
let initialLoadComplete = false;
let appInitialized = false;
const renderedMessageIds = new Set();
let roomsMetaCache = {};

let activeMessagesRef = null;
let activeOnlineRef = null;
let activePresenceUserRef = null;

// تسجيل صوتي
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

function showScreen(screenEl) {
    [authScreen, usernameScreen, chatScreen].forEach((s) => s.classList.remove("active"));
    screenEl.classList.add("active");
}

function getAuthErrorMessage(err) {
    if (!err || !err.code) return "حدث خطأ غير متوقع.";
    switch (err.code) {
        case "auth/invalid-email":
            return "صيغة البريد الإلكتروني غير صحيحة.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        case "auth/email-already-in-use":
            return "هذا البريد الإلكتروني مسجل مسبقاً.";
        case "auth/weak-password":
            return "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
        case "auth/popup-blocked":
            return "تم حظر نافذة تسجيل الدخول، جرّب المتصفح مباشرة.";
        default:
            return err.message || "تعذر إتمام تسجيل الدخول.";
    }
}

// 1. تسجيل الدخول بالبريد وكلمة المرور
emailLoginBtn.addEventListener("click", async () => {
    authError.textContent = "";
    const email = authEmailInput.value.trim();
    const pass = authPasswordInput.value;
    if (!email || !pass) {
        authError.textContent = "يرجى إدخال البريد الإلكتروني وكلمة المرور.";
        return;
    }
    try {
        await auth.signInWithEmailAndPassword(email, pass);
    } catch (err) {
        authError.textContent = getAuthErrorMessage(err);
    }
});

emailSignupBtn.addEventListener("click", async () => {
    authError.textContent = "";
    const email = authEmailInput.value.trim();
    const pass = authPasswordInput.value;
    if (!email || !pass) {
        authError.textContent = "يرجى إدخال البريد الإلكتروني وكلمة المرور لإنشاء حساب.";
        return;
    }
    try {
        await auth.createUserWithEmailAndPassword(email, pass);
    } catch (err) {
        authError.textContent = getAuthErrorMessage(err);
    }
});

// 2. المتابعة باستخدام Google أو GitHub
async function signInWithProvider(provider) {
    authError.textContent = "";
    try {
        await auth.signInWithPopup(provider);
    } catch (err) {
        if (err.code === "auth/popup-blocked" || err.code === "auth/operation-not-supported-in-this-environment") {
            await auth.signInWithRedirect(provider);
        } else {
            authError.textContent = getAuthErrorMessage(err);
        }
    }
}

googleLoginBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    signInWithProvider(provider);
});

githubLoginBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GithubAuthProvider();
    signInWithProvider(provider);
});

// مراقبة حالة المصادقة
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        authUser = null;
        currentUser = "";
        appInitialized = false;
        cleanupRoomListeners();
        showScreen(authScreen);
        return;
    }

    authUser = user;
    const snap = await db.ref(`${DB_USERS_PATH}/${user.uid}/username`).once("value");
    const savedUsername = snap.val();

    if (savedUsername) {
        startChatSession(savedUsername);
    } else {
        setupUsernameInput.value = user.displayName || "";
        usernameError.textContent = "";
        showScreen(usernameScreen);
    }
});

// 3. حفظ / إضافة اسم المستخدم
saveUsernameBtn.addEventListener("click", async () => {
    if (!authUser) return;
    const name = setupUsernameInput.value.trim();
    if (!name) {
        usernameError.textContent = "يرجى كتابة اسم المستخدم أولاً.";
        return;
    }

    usernameError.textContent = "";
    await db.ref(`${DB_USERS_PATH}/${authUser.uid}`).set({
        username: name,
        email: authUser.email || "",
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    });

    startChatSession(name);
});

editUsernameBtn.addEventListener("click", () => {
    setupUsernameInput.value = currentUser;
    usernameError.textContent = "";
    showScreen(usernameScreen);
});

function startChatSession(username) {
    currentUser = username;
    sidebarUsername.textContent = currentUser;
    userAvatar.textContent = currentUser.charAt(0).toUpperCase() || "👤";
    showScreen(chatScreen);

    if (window.innerWidth <= 768) {
        waApp.classList.remove("chat-open");
    }

    if (!appInitialized) {
        appInitialized = true;
        initRooms();
    }

    if (currentRoom && roomsMetaCache[currentRoom]) {
        switchRoom(currentRoom, false);
    } else {
        currentRoom = "";
        currentRoomTitle.textContent = "اختر أو أنشئ غرفة";
        roomAvatar.textContent = "+";
        onlineUsersList.innerHTML = "";
        messagesContainer.innerHTML = "";
    }
}

backToRoomsBtn.addEventListener("click", () => {
    waApp.classList.remove("chat-open");
});

// 4. إدارة الغرف (إضافة + حذف لمن أنشأها فقط + رمز اختياري)
function initRooms() {
    const roomsRef = db.ref(DB_ROOMS_META_PATH);

    roomsRef.on("value", (snapshot) => {
        roomsListEl.innerHTML = "";
        const data = snapshot.val() || {};
        roomsMetaCache = {};

        const entries = Object.entries(data);
        if (entries.length === 0) {
            roomsListEl.innerHTML = `<p style="padding: 16px; font-size: 13px; color: var(--text-muted); text-align: center;">لا توجد غرف حالياً. أضف غرفتك الأولى من الأعلى!</p>`;
            if (currentRoom) {
                currentRoom = "";
                cleanupRoomListeners();
                currentRoomTitle.textContent = "اختر أو أنشئ غرفة";
                roomAvatar.textContent = "+";
                onlineUsersList.innerHTML = "";
                messagesContainer.innerHTML = "";
            }
            return;
        }

        entries.forEach(([key, roomObj]) => {
            if (!roomObj || !roomObj.name) return;

            roomsMetaCache[roomObj.name] = {
                key,
                name: roomObj.name,
                password: roomObj.password || "",
                createdBy: roomObj.createdBy || ""
            };

            const isLocked = Boolean(roomObj.password);
            const canDeleteRoom = Boolean(authUser && roomObj.createdBy && roomObj.createdBy === authUser.uid);

            const item = document.createElement("div");
            item.className = "room-item" + (roomObj.name === currentRoom ? " active" : "");
            item.dataset.roomName = roomObj.name;

            item.innerHTML = `
                <div class="room-item-left">
                    <div class="room-avatar">${escapeHTML(roomObj.name.charAt(0))}</div>
                    <span class="room-item-name">${escapeHTML(roomObj.name)}</span>
                </div>
                <div class="room-item-actions">
                    <span>${isLocked ? "🔒" : ""}</span>
                    ${canDeleteRoom ? `<button type="button" class="delete-room-btn" title="حذف الغرفة">🗑️</button>` : ""}
                </div>
            `;

            item.addEventListener("click", () => {
                attemptSwitchRoom(roomObj.name);
            });

            if (canDeleteRoom) {
                const delRoomBtn = item.querySelector(".delete-room-btn");
                if (delRoomBtn) {
                    delRoomBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        deleteRoom(key, roomObj.name, roomObj.createdBy);
                    });
                }
            }

            roomsListEl.appendChild(item);
        });

        if (currentRoom && !roomsMetaCache[currentRoom]) {
            currentRoom = "";
            cleanupRoomListeners();
            currentRoomTitle.textContent = "اختر أو أنشئ غرفة";
            roomAvatar.textContent = "+";
            onlineUsersList.innerHTML = "";
            messagesContainer.innerHTML = "";
        }
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
    if (!authUser) return;
    const roomName = newRoomInput.value.trim();
    const roomPass = newRoomPass.value.trim();
    if (!roomName) return;

    const safeKey = sanitizeRoomKey(roomName);
    if (!safeKey) return;

    db.ref(`${DB_ROOMS_META_PATH}/${safeKey}`).set({
        name: roomName,
        password: roomPass,
        createdBy: authUser.uid
    }).then(() => {
        if (roomPass) {
            sessionStorage.setItem(`room_unlocked_${safeKey}`, "1");
        }
        newRoomInput.value = "";
        newRoomPass.value = "";
        switchRoom(roomName, true);
    });
}

async function deleteRoom(safeKey, roomName, createdBy) {
    if (!authUser || createdBy !== authUser.uid) {
        alert("يمكن فقط لمن أنشأ هذه الغرفة حذفها.");
        return;
    }

    const confirmed = confirm(`هل أنت متأكد من حذف الغرفة "${roomName}" وجميع رسائلها؟`);
    if (!confirmed) return;

    if (currentRoom === roomName) {
        currentRoom = "";
        cleanupRoomListeners();
        currentRoomTitle.textContent = "اختر أو أنشئ غرفة";
        roomAvatar.textContent = "+";
        onlineUsersList.innerHTML = "";
        messagesContainer.innerHTML = "";
        if (window.innerWidth <= 768) {
            waApp.classList.remove("chat-open");
        }
    }

    await db.ref(`${DB_ROOMS_DATA_PATH}/${safeKey}`).remove();
    await db.ref(`${DB_ROOMS_META_PATH}/${safeKey}`).remove();
}

function sanitizeRoomKey(name) {
    return name.replace(/[.#$/[\]]/g, "_").trim();
}

function attemptSwitchRoom(roomName) {
    const meta = roomsMetaCache[roomName];
    const requiredPass = meta ? (meta.password || "") : "";
    const safeKey = sanitizeRoomKey(roomName);

    if (!requiredPass) {
        switchRoom(roomName, true);
        return;
    }

    if (sessionStorage.getItem(`room_unlocked_${safeKey}`) === "1") {
        switchRoom(roomName, true);
        return;
    }

    const enteredPass = prompt(`الغرفة "${roomName}" محمية برمز سري. أدخل الرمز:`);
    if (enteredPass === null) return;

    if (enteredPass.trim() === requiredPass) {
        sessionStorage.setItem(`room_unlocked_${safeKey}`, "1");
        switchRoom(roomName, true);
    } else {
        alert("رمز الغرفة غير صحيح!");
    }
}

function cleanupRoomListeners() {
    if (activePresenceUserRef) {
        activePresenceUserRef.onDisconnect().cancel();
        activePresenceUserRef.set(null);
        activePresenceUserRef = null;
    }
    if (activeMessagesRef) {
        activeMessagesRef.off();
        activeMessagesRef = null;
    }
    if (activeOnlineRef) {
        activeOnlineRef.off();
        activeOnlineRef = null;
    }
}

function switchRoom(roomName, openPanelOnMobile = true) {
    cleanupRoomListeners();

    currentRoom = roomName;
    currentRoomTitle.textContent = currentRoom;
    roomAvatar.textContent = currentRoom.charAt(0) || "#";

    document.querySelectorAll(".room-item").forEach((el) => {
        el.classList.toggle("active", el.dataset.roomName === currentRoom);
    });

    if (openPanelOnMobile && window.innerWidth <= 768) {
        waApp.classList.add("chat-open");
    }

    messagesContainer.innerHTML = "";
    renderedMessageIds.clear();
    initialLoadComplete = false;

    setupRoomPresence(currentUser, currentRoom);
    listenForRoomMessages(currentRoom);
}

// 5. المتصلون في الغرفة
function setupRoomPresence(username, roomName) {
    const safeRoom = sanitizeRoomKey(roomName);
    const connectedRef = db.ref(".info/connected");
    const userStatusRef = db.ref(`${DB_ROOMS_DATA_PATH}/${safeRoom}/online_users/${username}`);
    activePresenceUserRef = userStatusRef;

    connectedRef.off();
    connectedRef.on("value", (snap) => {
        if (snap.val() === true && currentRoom === roomName) {
            userStatusRef.onDisconnect().remove();
            userStatusRef.set(true);
        }
    });

    activeOnlineRef = db.ref(`${DB_ROOMS_DATA_PATH}/${safeRoom}/online_users`);
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

// 6. إرسال رسالة نصية
messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (isSending || !currentRoom || !authUser) return;

    const text = messageInput.value.trim();
    if (!text) return;

    isSending = true;
    messageInput.value = "";

    const safeRoom = sanitizeRoomKey(currentRoom);
    db.ref(`${DB_ROOMS_DATA_PATH}/${safeRoom}/messages`).push({
        sender: currentUser,
        senderUid: authUser.uid,
        type: "text",
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).finally(() => {
        isSending = false;
    });
});

// 7. إرسال صورة مضغوطة
imageBtn.addEventListener("click", () => {
    if (!currentRoom) {
        alert("اختر أو أنشئ غرفة أولاً.");
        return;
    }
    imageInput.click();
});

imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !currentRoom || !authUser) return;

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

            db.ref(`${DB_ROOMS_DATA_PATH}/${safeRoom}/messages`).push({
                sender: currentUser,
                senderUid: authUser.uid,
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

// 8. تسجيل وإرسال رسالة صوتية
micBtn.addEventListener("click", async () => {
    if (!currentRoom && !isRecording) {
        alert("اختر أو أنشئ غرفة أولاً.");
        return;
    }

    if (!isRecording) {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("المتصفح لا يدعم تسجيل الصوت هنا.");
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach((track) => track.stop());
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });

                if (audioBlob.size > 900 * 1024) {
                    alert("الرسالة الصوتية طويلة جداً، جرّب تسجيلاً أقصر.");
                    return;
                }

                const reader = new FileReader();
                reader.onloadend = () => {
                    if (!currentRoom || !authUser) return;
                    const safeRoom = sanitizeRoomKey(currentRoom);
                    db.ref(`${DB_ROOMS_DATA_PATH}/${safeRoom}/messages`).push({
                        sender: currentUser,
                        senderUid: authUser.uid,
                        type: "audio",
                        audioUrl: reader.result,
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    });
                };
                reader.readAsDataURL(audioBlob);
            };

            mediaRecorder.start();
            isRecording = true;
            micBtn.classList.add("recording");
            micBtn.textContent = "⏹";
            recordingIndicator.hidden = false;
        } catch (err) {
            alert("تعذر الوصول إلى الميكروفون. تأكد من إعطاء صلاحية الميكروفون.");
        }
    } else {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
        }
        isRecording = false;
        micBtn.classList.remove("recording");
        micBtn.textContent = "🎤";
        recordingIndicator.hidden = true;
    }
});

// 9. استقبال وحذف الرسائل
function listenForRoomMessages(roomName) {
    const safeRoom = sanitizeRoomKey(roomName);
    activeMessagesRef = db.ref(`${DB_ROOMS_DATA_PATH}/${safeRoom}/messages`);

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

    const isMine = authUser ? data.senderUid === authUser.uid : data.sender === currentUser;
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
    } else if (data.type === "audio") {
        contentHTML = `<audio controls src="${data.audioUrl}" class="chat-audio"></audio>`;
    } else {
        contentHTML = `<p>${escapeHTML(data.text || "")}</p>`;
    }

    const deleteBtnHTML = isMine
        ? `<button type="button" class="delete-msg-btn" title="حذف الرسالة">🗑️</button>`
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
    if (!msgId || !currentRoom) return;
    const safeRoom = sanitizeRoomKey(currentRoom);
    db.ref(`${DB_ROOMS_DATA_PATH}/${safeRoom}/messages/${msgId}`).remove();
}

// 10. صوت التنبيه والواجهة وتسجيل الخروج
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

logoutBtn.addEventListener("click", async () => {
    cleanupRoomListeners();
    sessionStorage.clear();
    await auth.signOut();
});
