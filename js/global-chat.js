// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyC42b8Vqjq7FcXVEybF5CpYDVp5MjWO8T0",
    authDomain: "hackathon2025-40af0.firebaseapp.com",
    databaseURL: "https://hackathon2025-40af0-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "hackathon2025-40af0",
    storageBucket: "hackathon2025-40af0.appspot.com",
    messagingSenderId: "870888203476",
    appId: "1:870888203476:web:c111521e765865259d4741"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// DOM Elements
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const emojiBtn = document.getElementById('emoji-btn');
const onlineUsersDiv = document.getElementById('online-users');

// Initialize emoji picker
const picker = new emojiBtn();
picker.on('emoji', emoji => {
    messageInput.value += emoji;
    messageInput.focus();
});
emojiBtn.addEventListener('click', () => picker.togglePicker(emojiBtn));

// Messages Reference
const messagesRef = db.ref('global_messages');
const onlineRef = db.ref('online_users');

// Current user data
let currentUser = null;
let userProfile = null;

// Handle Auth State Changes
auth.onAuthStateChanged(async user => {
    if (user) {
        const userRef = db.ref(`users/${user.uid}`);
        const snapshot = await userRef.get();
        userProfile = snapshot.val();
        currentUser = user;
        
        // Set user as online
        const userStatusRef = db.ref(`online_users/${user.uid}`);
        userStatusRef.set({
            name: `${userProfile.firstname} ${userProfile.surname}`,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Remove user when disconnected
        userStatusRef.onDisconnect().remove();
        
        // Enable input
        messageInput.disabled = false;
        sendBtn.disabled = false;
        
        loadMessages();
        trackOnlineUsers();
    } else {
        window.location.href = 'login.html';
    }
});

// Load and track messages
function loadMessages() {
    messagesRef.on('child_added', snapshot => {
        const message = snapshot.val();
        const messageDiv = createMessageElement(message);
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Track online users
function trackOnlineUsers() {
    onlineRef.on('value', snapshot => {
        const users = snapshot.val() || {};
        onlineUsersDiv.innerHTML = `Online: ${Object.keys(users).length}`;
    });
}

// Create message element
function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `message ${message.uid === currentUser.uid ? 'sent' : 'received'}`;
    
    div.innerHTML = `
        <div class="message-header">
            <span class="message-author">${message.author}</span>
            <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="message-content">${message.text}</div>
    `;
    
    return div;
}

// Send message
async function sendMessage() {
    if (!messageInput.value.trim()) return;
    
    const message = {
        text: messageInput.value.trim(),
        author: `${userProfile.firstname} ${userProfile.surname}`,
        uid: currentUser.uid,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    await messagesRef.push().set(message);
    messageInput.value = '';
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});