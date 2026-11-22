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

const USERS_PATH = "wa_users";
const ROOMS_PATH = "wa_rooms";
const DM_PATH = "wa_dm_messages";

const SVG_ICONS = {
    lock: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
    key: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`,
    bellOn: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>`,
    bellOff: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 18.69L7.84 6.14 5.27 3.49 4 4.76l2.8 2.8v.01c-.52.99-.8 2.16-.8 3.42v5l-2 2v1h13.73l2 2L21 19.72l-1-1.03zM12 22c1.11 0 2-.89 2-2h-4c0 1.11.89 2 2 2zm6-7.32V11c0-3.08-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.15.03-.29.08-.42.12-.1.03-.2.07-.3.11h-.01c-.01 0-.01 0-.02.01-.23.09-.46.2-.68.31 0 0-.01 0-.01.01L18 14.68z"/></svg>`,
    mic: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>`,
    stop: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>`
};

// الشاشات
const authScreen = document.getElementById("auth-screen");
const profileScreen = document.getElementById("profile-screen");
const chatScreen = document.getElementById("chat-screen");

// عناصر الدخول
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const emailLoginBtn = document.getElementById("email-login-btn");
const emailSignupBtn = document.getElementById("email-signup-btn");
const googleLoginBtn = document.getElementById("google-login-btn");
const githubLoginBtn = document.getElementById("github-login-btn");
const authError = document.getElementById("auth-error");

// عناصر الملف الشخصي
const setupUsernameInput = document.getElementById("setup-username-input");
const setupPinInput = document.getElementById("setup-pin-input");
const saveProfileBtn = document.getElementById("save-profile-btn");
const editProfileBtn = document.getElementById("edit-profile-btn");
const copyPinBtn = document.getElementById("copy-pin-btn");
const profileError = document.getElementById("profile-error");

// عناصر الواجهة
const waApp = document.querySelector(".wa-app");
const sidebarUsername = document.getElementById("sidebar-username");
const userAvatar = document.getElementById("user-avatar");
const searchInput = document.getElementById("search-input");

const newRoomInput = document.getElementById("new-room-input");
const newRoomPass = document.getElementById("new-room-pass");
const createRoomBtn = document.getElementById("create-room-btn");
const joinRoomBtn = document.getElementById("join-room-btn");

const tabRoomsBtn = document.getElementById("tab-rooms-btn");
const tabUsersBtn = document.getElementById("tab-users-btn");
const roomsListEl = document.getElementById("rooms-list");
const usersListEl = document.getElementById("users-list");

const backToRoomsBtn = document.getElementById("back-to-rooms-btn");
const chatAvatar = document.getElementById("chat-avatar");
const currentChatTitle = document.getElementById("current-chat-title");
const currentChatSubtitle = document.getElementById("current-chat-subtitle");

const messagesContainer = document.getElementById("messages-container");
const scrollBottomBtn = document.getElementById("scroll-bottom-btn");
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
let myProfile = { username: "", pin: "" };
let activeChat = null;
let activeMessagesRef = null;
let usersCache = {};
let roomsCache = {};
let unreadChats = new Set();
let searchQuery = "";
let soundEnabled = true;
let isSending = false;
let initialLoadComplete = false;
const renderedIds = new Set();

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

function showScreen(el) {
    [authScreen, profileScreen, chatScreen].forEach((s) => s.classList.remove("active"));
    el.classList.add("active");
}

function getAuthError(err) {
    if (!err || !err.code) return "حدث خطأ غير متوقع.";
    switch (err.code) {
        case "auth/invalid-email":
            return "البريد الإلكتروني غير صحيح.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        case "auth/email-already-in-use":
            return "هذا البريد الإلكتروني مستخدم بالفعل.";
        case "auth/weak-password":
            return "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
        default:
            return err.message || "تعذر تسجيل الدخول.";
    }
}

// طلب إذن الإشعارات للعمل حتى خارج الموقع
async function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
        try {
            await Notification.requestPermission();
        } catch {}
    }
}

function triggerIncomingAlert(title, body) {
    if (soundEnabled) {
        playBeep();
    }
    if (!soundEnabled || !("Notification" in window)) return;

    if (Notification.permission === "granted" && (document.hidden || !document.hasFocus())) {
        try {
            const notif = new Notification(title, {
                body: body || "رسالة جديدة",
                silent: false
            });
            notif.onclick = () => {
                window.focus();
                notif.close();
            };
        } catch {}
    }
}

// المصادقة
emailLoginBtn.addEventListener("click", async () => {
    authError.textContent = "";
    const email = authEmailInput.value.trim();
    const pass = authPasswordInput.value;
    if (!email || !pass) {
        authError.textContent = "أدخل البريد الإلكتروني وكلمة المرور.";
        return;
    }
    try {
        await auth.signInWithEmailAndPassword(email, pass);
    } catch (err) {
        authError.textContent = getAuthError(err);
    }
});

emailSignupBtn.addEventListener("click", async () => {
    authError.textContent = "";
    const email = authEmailInput.value.trim();
    const pass = authPasswordInput.value;
    if (!email || !pass) {
        authError.textContent = "أدخل البريد الإلكتروني وكلمة المرور لإنشاء حساب.";
        return;
    }
    try {
        await auth.createUserWithEmailAndPassword(email, pass);
    } catch (err) {
        authError.textContent = getAuthError(err);
    }
});

async function signWithProvider(provider) {
    authError.textContent = "";
    try {
        await auth.signInWithPopup(provider);
    } catch (err) {
        if (err.code === "auth/popup-blocked" || err.code === "auth/operation-not-supported-in-this-environment") {
            await auth.signInWithRedirect(provider);
        } else {
            authError.textContent = getAuthError(err);
        }
    }
}

googleLoginBtn.addEventListener("click", () => signWithProvider(new firebase.auth.GoogleAuthProvider()));
githubLoginBtn.addEventListener("click", () => signWithProvider(new firebase.auth.GithubAuthProvider()));

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        authUser = null;
        myProfile = { username: "", pin: "" };
        stopMessagesListener();
        showScreen(authScreen);
        return;
    }

    authUser = user;
    requestNotificationPermission();

    try {
        const snap = await db.ref(`${USERS_PATH}/${user.uid}`).once("value");
        const data = snap.val();

        if (data && data.username) {
            myProfile = { username: data.username, pin: data.pin || "" };
            openMainApp();
        } else {
            setupUsernameInput.value = user.displayName || "";
            setupPinInput.value = "";
            profileError.textContent = "";
            showScreen(profileScreen);
        }
    } catch (err) {
        alert("تعذر قراءة ملف المستخدم: " + (err.message || err));
    }
});

// حفظ الملف الشخصي
saveProfileBtn.addEventListener("click", async () => {
    if (!authUser) return;
    const username = setupUsernameInput.value.trim();
    const pin = setupPinInput.value.trim();

    if (!username) {
        profileError.textContent = "يرجى كتابة اسم المستخدم.";
        return;
    }
    if (!pin) {
        profileError.textContent = "يرجى تحديد رمزك الخاص ليتمكن الآخرون من مراسلتك.";
        return;
    }

    profileError.textContent = "";
    myProfile = { username, pin };

    try {
        await db.ref(`${USERS_PATH}/${authUser.uid}`).set({
            uid: authUser.uid,
            username,
            pin,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        openMainApp();
    } catch (err) {
        profileError.textContent = "تعذر حفظ الملف الشخصي: " + (err.message || err);
    }
});

editProfileBtn.addEventListener("click", () => {
    setupUsernameInput.value = myProfile.username;
    setupPinInput.value = myProfile.pin;
    profileError.textContent = "";
    showScreen(profileScreen);
});

copyPinBtn.addEventListener("click", async () => {
    if (!myProfile.pin) return;
    try {
        await navigator.clipboard.writeText(myProfile.pin);
        copyPinBtn.textContent = "تم النسخ ✓";
        setTimeout(() => { copyPinBtn.textContent = "نسخ رمزي"; }, 1800);
    } catch {
        alert(`رمزك الخاص هو: ${myProfile.pin}`);
    }
});

function openMainApp() {
    sidebarUsername.textContent = myProfile.username;
    userAvatar.textContent = myProfile.username.charAt(0).toUpperCase() || "U";
    showScreen(chatScreen);

    if (window.innerWidth <= 768 && !activeChat) {
        waApp.classList.remove("chat-open");
    }

    listenRooms();
    listenUsers();
}

// البحث والتبويبات
searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderRoomsList();
    renderUsersList();
});

tabRoomsBtn.addEventListener("click", () => {
    tabRoomsBtn.classList.add("active");
    tabUsersBtn.classList.remove("active");
    roomsListEl.classList.add("active");
    usersListEl.classList.remove("active");
});

tabUsersBtn.addEventListener("click", () => {
    tabUsersBtn.classList.add("active");
    tabRoomsBtn.classList.remove("active");
    usersListEl.classList.add("active");
    roomsListEl.classList.remove("active");
});

backToRoomsBtn.addEventListener("click", () => {
    waApp.classList.remove("chat-open");
});

// 1. إنشاء مجموعة جديدة وتسجيل المنشئ فيها
createRoomBtn.addEventListener("click", createRoom);
joinRoomBtn.addEventListener("click", joinExistingRoom);

newRoomInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        createRoom();
    }
});

async function createRoom() {
    if (!authUser) return;
    const name = newRoomInput.value.trim();
    const pass = newRoomPass.value.trim();
    if (!name) {
        alert("اكتب اسم المجموعة أولاً.");
        return;
    }

    try {
        const ref = db.ref(ROOMS_PATH).push();
        const roomData = {
            id: ref.key,
            name,
            password: pass,
            ownerUid: authUser.uid,
            ownerName: myProfile.username || authUser.email || "مستخدم",
            members: {
                [authUser.uid]: true
            },
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        await ref.set(roomData);

        newRoomInput.value = "";
        newRoomPass.value = "";

        if (pass) {
            sessionStorage.setItem(`room_ok_${ref.key}`, "1");
        }

        openRoomChat(roomData);
    } catch (err) {
        alert("تعذر إنشاء المجموعة: " + (err.message || err));
    }
}

// 2. الدخول إلى مجموعة موجودة وتسجيل المستخدم كعضو فيها
async function joinExistingRoom() {
    if (!authUser) return;
    const targetName = newRoomInput.value.trim();
    const enteredPass = newRoomPass.value.trim();

    if (!targetName) {
        alert("اكتب اسم المجموعة التي تريد الدخول إليها.");
        return;
    }

    try {
        const snap = await db.ref(ROOMS_PATH).once("value");
        const allRooms = snap.val() || {};
        const foundRoom = Object.values(allRooms).find(
            (r) => r && r.name && r.name.trim().toLowerCase() === targetName.toLowerCase()
        );

        if (!foundRoom) {
            alert("لا توجد مجموعة بهذا الاسم.");
            return;
        }

        const isMember = Boolean(foundRoom.members && foundRoom.members[authUser.uid]);
        if (foundRoom.password && !isMember && enteredPass !== foundRoom.password) {
            alert("رمز المجموعة غير صحيح!");
            return;
        }

        await db.ref(`${ROOMS_PATH}/${foundRoom.id}/members/${authUser.uid}`).set(true);
        if (foundRoom.password) {
            sessionStorage.setItem(`room_ok_${foundRoom.id}`, "1");
        }

        newRoomInput.value = "";
        newRoomPass.value = "";

        openRoomChat({
            ...foundRoom,
            members: { ...(foundRoom.members || {}), [authUser.uid]: true }
        });
    } catch (err) {
        alert("تعذر الدخول إلى المجموعة: " + (err.message || err));
    }
}

function listenRooms() {
    db.ref(ROOMS_PATH).off();
    db.ref(ROOMS_PATH).on("value", (snap) => {
        roomsCache = snap.val() || {};
        renderRoomsList();
    }, (err) => {
        console.error("Rooms listener error:", err);
    });
}

// عرض المجموعات التي يكون المستخدم مسجلاً فيها فقط
function renderRoomsList() {
    roomsListEl.innerHTML = "";
    const list = Object.values(roomsCache).filter((r) => {
        if (!r || !r.name || !authUser) return false;
        const isMember = Boolean(r.members && r.members[authUser.uid]);
        if (!isMember) return false;
        return !searchQuery || r.name.toLowerCase().includes(searchQuery);
    });

    if (list.length === 0) {
        roomsListEl.innerHTML = `<p style="padding:16px;font-size:13px;color:var(--text-muted);text-align:center;">لست مسجلاً في أي مجموعة بعد. أنشئ مجموعة أو ادخل إلى مجموعة من الأعلى.</p>`;
        if (activeChat && activeChat.kind === "room") {
            resetChatArea();
        }
        return;
    }

    list.forEach((room) => {
        const isOwner = authUser && room.ownerUid === authUser.uid;
        const isActive = activeChat && activeChat.kind === "room" && activeChat.id === room.id;
        const hasUnread = unreadChats.has(`room_${room.id}`);

        const item = document.createElement("div");
        item.className = "list-item" + (isActive ? " active" : "");
        item.innerHTML = `
            <div class="list-item-left">
                <div class="room-avatar">${escapeHTML(room.name.charAt(0))}</div>
                <div>
                    <div class="list-item-title">${escapeHTML(room.name)}</div>
                    <small style="color:var(--text-muted)">${escapeHTML(room.ownerName || "")}</small>
                </div>
            </div>
            <div class="list-item-right">
                ${hasUnread ? `<span class="unread-dot"></span>` : ""}
                ${room.password ? SVG_ICONS.lock : ""}
                ${isOwner ? `<button type="button" class="delete-btn" title="حذف المجموعة">${SVG_ICONS.trash}</button>` : ""}
            </div>
        `;

        item.addEventListener("click", () => {
            unreadChats.delete(`room_${room.id}`);
            openRoomChat(room);
            renderRoomsList();
        });

        if (isOwner) {
            const delBtn = item.querySelector(".delete-btn");
            delBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                if (!confirm(`حذف المجموعة "${room.name}"؟`)) return;
                if (activeChat && activeChat.kind === "room" && activeChat.id === room.id) {
                    resetChatArea();
                }
                await db.ref(`${ROOMS_PATH}/${room.id}`).remove();
            });
        }

        roomsListEl.appendChild(item);
    });
}

function listenUsers() {
    db.ref(USERS_PATH).off();
    db.ref(USERS_PATH).on("value", (snap) => {
        usersCache = snap.val() || {};
        renderUsersList();
    }, (err) => {
        console.error("Users listener error:", err);
    });
}

function renderUsersList() {
    usersListEl.innerHTML = "";
    const others = Object.values(usersCache).filter(
        (u) => authUser && u.uid !== authUser.uid && u.username &&
               (!searchQuery || u.username.toLowerCase().includes(searchQuery))
    );

    if (others.length === 0) {
        usersListEl.innerHTML = `<p style="padding:16px;font-size:13px;color:var(--text-muted);text-align:center;">لا توجد محادثات متاحة حالياً.</p>`;
        return;
    }

    others.forEach((user) => {
        const dmId = getDmId(authUser.uid, user.uid);
        const isActive = activeChat && activeChat.kind === "dm" && activeChat.id === dmId;
        const hasUnread = unreadChats.has(`dm_${dmId}`);

        const item = document.createElement("div");
        item.className = "list-item" + (isActive ? " active" : "");
        item.innerHTML = `
            <div class="list-item-left">
                <div class="avatar">${escapeHTML(user.username.charAt(0).toUpperCase())}</div>
                <div>
                    <div class="list-item-title">${escapeHTML(user.username)}</div>
                    <small style="color:var(--text-muted)">محادثة خاصة برمز</small>
                </div>
            </div>
            <div class="list-item-right">
                ${hasUnread ? `<span class="unread-dot"></span>` : ""}
                ${SVG_ICONS.key}
            </div>
        `;

        item.addEventListener("click", () => {
            const unlockedKey = `dm_unlocked_${user.uid}`;
            if (user.pin && sessionStorage.getItem(unlockedKey) !== "1") {
                const enteredPin = prompt(`لمراسلة ${user.username}، أدخل رمزه الخاص:`);
                if (enteredPin === null) return;
                if (enteredPin.trim() !== String(user.pin).trim()) {
                    alert("الرمز الخاص غير صحيح!");
                    return;
                }
                sessionStorage.setItem(unlockedKey, "1");
            }
            unreadChats.delete(`dm_${dmId}`);
            openDmChat(user);
            renderUsersList();
        });

        usersListEl.appendChild(item);
    });
}

function getDmId(uid1, uid2) {
    return [uid1, uid2].sort().join("_");
}

function openRoomChat(room) {
    activeChat = { kind: "room", id: room.id, title: room.name };
    chatAvatar.textContent = (room.name || "#").charAt(0);
    currentChatTitle.textContent = room.name || "مجموعة";
    currentChatSubtitle.textContent = `مجموعة • ${room.ownerName || ""}`;

    if (window.innerWidth <= 768) {
        waApp.classList.add("chat-open");
    }

    renderRoomsList();
    startMessagesListener(`${ROOMS_PATH}/${room.id}/messages`);
}

function openDmChat(targetUser) {
    const dmId = getDmId(authUser.uid, targetUser.uid);
    activeChat = { kind: "dm", id: dmId, title: targetUser.username, targetUid: targetUser.uid };
    chatAvatar.textContent = targetUser.username.charAt(0).toUpperCase() || "U";
    currentChatTitle.textContent = targetUser.username;
    currentChatSubtitle.textContent = "محادثة ثنائية خاصة بينكما فقط";

    if (window.innerWidth <= 768) {
        waApp.classList.add("chat-open");
    }

    renderUsersList();
    startMessagesListener(`${DM_PATH}/${dmId}`);
}

function resetChatArea() {
    activeChat = null;
    stopMessagesListener();
    currentChatTitle.textContent = "اختر مجموعة أو محادثة";
    currentChatSubtitle.textContent = "محادثاتك خاصة ومحمية";
    messagesContainer.innerHTML = "";
}

function stopMessagesListener() {
    if (activeMessagesRef) {
        activeMessagesRef.off();
        activeMessagesRef = null;
    }
}

function startMessagesListener(path) {
    stopMessagesListener();
    messagesContainer.innerHTML = "";
    renderedIds.clear();
    initialLoadComplete = false;

    activeMessagesRef = db.ref(path);
    setTimeout(() => { initialLoadComplete = true; }, 1200);

    activeMessagesRef.on("child_added", (snap) => {
        const data = snap.val();
        if (!data) return;
        renderMessage(snap.key, data);

        if (initialLoadComplete && data.senderUid !== authUser.uid) {
            const preview = data.type === "image"
                ? "أرسل صورة"
                : data.type === "audio"
                    ? "أرسل رسالة صوتية"
                    : (data.text || "رسالة جديدة");
            triggerIncomingAlert(data.sender || "رسالة جديدة", preview);
        }
    }, (err) => {
        console.error("Messages listener error:", err);
    });

    activeMessagesRef.on("child_removed", (snap) => {
        const el = document.getElementById(`m-${snap.key}`);
        if (el) el.remove();
    });
}

function getCurrentMessagesPath() {
    if (!activeChat || !activeChat.id) return null;
    return activeChat.kind === "room"
        ? `${ROOMS_PATH}/${activeChat.id}/messages`
        : `${DM_PATH}/${activeChat.id}`;
}

// إرسال نص
messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSending) return;

    if (!authUser) {
        alert("يجب تسجيل الدخول أولاً.");
        return;
    }

    if (!activeChat) {
        alert("اختر مجموعة أو محادثة أولاً لإرسال رسالة.");
        return;
    }

    const text = messageInput.value.trim();
    if (!text) return;

    const path = getCurrentMessagesPath();
    if (!path) return;

    isSending = true;
    const originalText = text;
    messageInput.value = "";

    try {
        await db.ref(path).push({
            sender: myProfile.username || authUser.email || "مستخدم",
            senderUid: authUser.uid,
            type: "text",
            text: originalText,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (err) {
        messageInput.value = originalText;
        alert("لم يتم إرسال الرسالة: " + (err.message || err));
    } finally {
        isSending = false;
    }
});

// إرسال صورة
imageBtn.addEventListener("click", () => {
    if (!activeChat) {
        alert("اختر مجموعة أو محادثة أولاً.");
        return;
    }
    imageInput.click();
});

imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat || !authUser) return;

    const path = getCurrentMessagesPath();
    if (!path) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement("canvas");
            const MAX_W = 600;
            const scale = MAX_W / img.width;
            canvas.width = img.width > MAX_W ? MAX_W : img.width;
            canvas.height = img.width > MAX_W ? img.height * scale : img.height;
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

            try {
                await db.ref(path).push({
                    sender: myProfile.username || authUser.email || "مستخدم",
                    senderUid: authUser.uid,
                    type: "image",
                    imageUrl: canvas.toDataURL("image/jpeg", 0.7),
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            } catch (err) {
                alert("تعذر إرسال الصورة: " + (err.message || err));
            }
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    imageInput.value = "";
});

// إرسال صوت
micBtn.addEventListener("click", async () => {
    if (!activeChat && !isRecording) {
        alert("اختر مجموعة أو محادثة أولاً.");
        return;
    }

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (ev) => {
                if (ev.data && ev.data.size > 0) audioChunks.push(ev.data);
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
                const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
                if (blob.size > 900 * 1024) {
                    alert("التسجيل طويل جداً.");
                    return;
                }
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const path = getCurrentMessagesPath();
                    if (!path || !authUser) return;
                    try {
                        await db.ref(path).push({
                            sender: myProfile.username || authUser.email || "مستخدم",
                            senderUid: authUser.uid,
                            type: "audio",
                            audioUrl: reader.result,
                            timestamp: firebase.database.ServerValue.TIMESTAMP
                        });
                    } catch (err) {
                        alert("تعذر إرسال التسجيل الصوتي: " + (err.message || err));
                    }
                };
                reader.readAsDataURL(blob);
            };

            mediaRecorder.start();
            isRecording = true;
            micBtn.classList.add("recording");
            micBtn.innerHTML = SVG_ICONS.stop;
            recordingIndicator.hidden = false;
        } catch {
            alert("تعذر الوصول للميكروفون.");
        }
    } else {
        if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
        isRecording = false;
        micBtn.classList.remove("recording");
        micBtn.innerHTML = SVG_ICONS.mic;
        recordingIndicator.hidden = true;
    }
});

function renderMessage(id, data) {
    if (!id || renderedIds.has(id) || document.getElementById(`m-${id}`)) return;
    renderedIds.add(id);

    const isMine = authUser && data.senderUid === authUser.uid;
    const div = document.createElement("div");
    div.id = `m-${id}`;
    div.className = "message " + (isMine ? "mine" : "other");

    const time = data.timestamp
        ? new Date(data.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
        : "";

    let body = "";
    if (data.type === "image") {
        body = `<img src="${data.imageUrl}" class="chat-image" onclick="window.open(this.src)" alt="صورة">`;
    } else if (data.type === "audio") {
        body = `<audio controls src="${data.audioUrl}" class="chat-audio"></audio>`;
    } else {
        body = `<p>${escapeHTML(data.text || "")}</p>`;
    }

    div.innerHTML = `
        ${!isMine ? `<span class="msg-sender">${escapeHTML(data.sender || "")}</span>` : ""}
        ${body}
        <div class="msg-footer">
            <span class="msg-time">${time}</span>
            ${isMine ? `<button type="button" class="delete-msg-btn" title="حذف">${SVG_ICONS.trash}</button>` : ""}
        </div>
    `;

    if (isMine) {
        const del = div.querySelector(".delete-msg-btn");
        if (del) {
            del.addEventListener("click", () => {
                const path = getCurrentMessagesPath();
                if (path) db.ref(`${path}/${id}`).remove();
            });
        }
    }

    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// زر النزول لآخر رسالة
messagesContainer.addEventListener("scroll", () => {
    const distanceFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    scrollBottomBtn.hidden = distanceFromBottom < 140;
});

scrollBottomBtn.addEventListener("click", () => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

function playBeep() {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    } catch {}
}

soundToggle.addEventListener("click", async () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        await requestNotificationPermission();
    }
    soundToggle.innerHTML = soundEnabled ? SVG_ICONS.bellOn : SVG_ICONS.bellOff;
});

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("wa_theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
});

if (localStorage.getItem("wa_theme") === "dark") {
    document.body.classList.add("dark-mode");
}

logoutBtn.addEventListener("click", async () => {
    sessionStorage.clear();
    await auth.signOut();
});

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
