import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getDatabase, ref, push, onValue, get } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyC42b8Vqjq7FcXVEybF5CpYDVp5MjWO8T0",
    authDomain: "hackathon2025-40af0.firebaseapp.com",
    databaseURL: "https://hackathon2025-40af0-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "hackathon2025-40af0",
    storageBucket: "hackathon2025-40af0.appspot.com",
    messagingSenderId: "870888203476",
    appId: "1:870888203476:web:c111521e765865259d4741"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

let currentChatUser = null;
let currentUser = null;

// Load users list
async function loadUsers() {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    const users = snapshot.val();
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';

    for (const [uid, userData] of Object.entries(users)) {
        if (uid !== auth.currentUser.uid) {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';
            userDiv.innerHTML = `
                <div class="user-info">
                    <div class="user-name">${userData.firstname} ${userData.surname}</div>
                </div>
            `;
            userDiv.onclick = () => startChat(uid, userData);
            usersList.appendChild(userDiv);
        }
    }
}

// Start chat with user
function startChat(userId, userData) {
    currentChatUser = { uid: userId, ...userData };
    document.querySelector('.chat-header h2').textContent = `${userData.firstname} ${userData.surname}`;
    document.querySelector('.messages').innerHTML = '';
    loadMessages(userId);
    
    // Show chat container on mobile
    document.querySelector('.chat-container').classList.add('active');
}

// Load messages between users
function loadMessages(otherUserId) {
    const chatId = getChatId(auth.currentUser.uid, otherUserId);
    const messagesRef = ref(database, `direct_messages/${chatId}`);
    
    onValue(messagesRef, (snapshot) => {
        const messages = snapshot.val();
        const messagesDiv = document.querySelector('.messages');
        messagesDiv.innerHTML = '';
        
        if (messages) {
            Object.values(messages).forEach(msg => {
                const messageDiv = createMessageElement(msg);
                messagesDiv.appendChild(messageDiv);
            });
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    });
}

// Create message element
function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `message ${message.senderId === auth.currentUser.uid ? 'sent' : 'received'}`;
    
    div.innerHTML = `
        <div class="message-content">${message.text}</div>
        <div class="message-time">${formatTime(message.timestamp)}</div>
    `;
    
    return div;
}

// Send message
async function sendMessage() {
    if (!currentChatUser) return;
    
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text) return;

    const chatId = getChatId(auth.currentUser.uid, currentChatUser.uid);
    const messagesRef = ref(database, `direct_messages/${chatId}`);
    
    await push(messagesRef, {
        text,
        senderId: auth.currentUser.uid,
        timestamp: Date.now()
    });
    
    input.value = '';
}

// Helper function to generate consistent chat ID
function getChatId(uid1, uid2) {
    return [uid1, uid2].sort().join('_');
}

// Format timestamp
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    const backBtn = document.querySelector('.back-btn');

    sendBtn?.addEventListener('click', sendMessage);
    messageInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    backBtn?.addEventListener('click', () => {
        document.querySelector('.chat-container').classList.remove('active');
    });

    onAuthStateChanged(auth, user => {
        if (user) {
            currentUser = user;
            loadUsers();
        } else {
            window.location.href = 'login.html';
        }
    });
});