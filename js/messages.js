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

function loadUsers() {
    const usersRef = ref(database, 'users');
    get(usersRef).then((snapshot) => {
        const users = snapshot.val();
        const usersList = document.getElementById('users-list');
        if (!usersList) return;
        
        usersList.innerHTML = '';
        Object.entries(users).forEach(([uid, userData]) => {
            if (uid !== auth.currentUser?.uid) {
                const userDiv = document.createElement('div');
                userDiv.className = 'user-item';
                userDiv.innerHTML = `
                    <div class="user-info">
                        <div class="user-details">
                            <div class="user-name">${userData.firstname} ${userData.surname}</div>
                        </div>
                        <button class="chat-btn">Chat</button>
                    </div>
                `;
                const chatBtn = userDiv.querySelector('.chat-btn');
                chatBtn.onclick = (e) => {
                    e.stopPropagation();
                    startChat(uid, userData);
                };
                usersList.appendChild(userDiv);
            }
        });
    }).catch(error => console.error('Error loading users:', error));
}

function startChat(userId, userData) {
    currentChatUser = { uid: userId, ...userData };
    const chatHeader = document.querySelector('.chat-header h2');
    const messagesContainer = document.querySelector('.messages');
    const chatContainer = document.querySelector('.chat-container');
    
    if (chatHeader && messagesContainer && chatContainer) {
        chatHeader.textContent = `${userData.firstname} ${userData.surname}`;
        messagesContainer.innerHTML = '';
        loadMessages(userId);
        chatContainer.classList.add('active');
    }
}

function loadMessages(otherUserId) {
    const chatId = [auth.currentUser.uid, otherUserId].sort().join('_');
    const messagesRef = ref(database, `direct_messages/${chatId}`);
    
    onValue(messagesRef, (snapshot) => {
        const messages = snapshot.val();
        const messagesDiv = document.querySelector('.messages');
        if (!messagesDiv) return;
        
        messagesDiv.innerHTML = '';
        if (messages) {
            Object.entries(messages)
                .sort(([,a], [,b]) => a.timestamp - b.timestamp)
                .forEach(([, msg]) => {
                    const messageEl = createMessageElement(msg);
                    messagesDiv.appendChild(messageEl);
                });
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    });
}

function createMessageElement(msg) {
    const div = document.createElement('div');
    div.className = `message ${msg.senderId === auth.currentUser?.uid ? 'sent' : 'received'}`;
    div.innerHTML = `
        <div class="message-content">${msg.text}</div>
        <div class="message-time">${formatTime(msg.timestamp)}</div>
    `;
    return div;
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function sendMessage() {
    if (!currentChatUser || !auth.currentUser) return;
    
    const messageInput = document.getElementById('message-input');
    const text = messageInput?.value.trim();
    if (!text) return;

    const chatId = [auth.currentUser.uid, currentChatUser.uid].sort().join('_');
    const messagesRef = ref(database, `direct_messages/${chatId}`);
    
    push(messagesRef, {
        text,
        senderId: auth.currentUser.uid,
        timestamp: Date.now()
    }).then(() => {
        if (messageInput) messageInput.value = '';
    }).catch(error => console.error('Error sending message:', error));
}

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
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) chatContainer.classList.remove('active');
    });

    onAuthStateChanged(auth, user => {
        if (user) {
            loadUsers();
        } else {
            window.location.href = 'login.html';
        }
    });
});