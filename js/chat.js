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

let currentChatId = null;
let currentUser = null;

// DOM Elements
const messagesList = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const emojiBtn = document.getElementById('emoji-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const chatList = document.getElementById('chat-list');
const chatHeader = document.getElementById('chat-header');

// Initialize emoji picker
const picker = new EmojiButton();
picker.on('emoji', emoji => {
    messageInput.value += emoji;
    messageInput.focus();
});

// Event Listeners
emojiBtn.addEventListener('click', () => picker.togglePicker(emojiBtn));
newChatBtn.addEventListener('click', showNewChatModal);
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Check Authentication
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        loadChats();
    } else {
        window.location.href = 'login.html';
    }
});

function loadChats() {
    const userChatsRef = db.ref(`users/${currentUser.uid}/chats`);
    userChatsRef.on('value', async (snapshot) => {
        chatList.innerHTML = '';
        const chats = snapshot.val() || {};
        
        for (const [chatId, chat] of Object.entries(chats)) {
            const otherUserId = chat.participants.find(id => id !== currentUser.uid);
            const userSnapshot = await db.ref(`users/${otherUserId}`).get();
            const userData = userSnapshot.val() || {};
            
            const chatDiv = document.createElement('div');
            chatDiv.className = 'chat-item';
            if (chatId === currentChatId) chatDiv.classList.add('active');
            
            chatDiv.innerHTML = `
                <div class="chat-contact-name">${userData.firstname} ${userData.surname}</div>
                <div class="chat-last-message">${chat.lastMessage || 'Click to start chatting'}</div>
            `;
            
            chatDiv.onclick = () => openChat(chatId);
            chatList.appendChild(chatDiv);
        }
    });
}

async function openChat(chatId) {
    currentChatId = chatId;
    const chatRef = db.ref(`chats/${chatId}`);
    const chat = (await chatRef.get()).val() || {};
    
    const otherUserId = chat.participants.find(id => id !== currentUser.uid);
    const userData = (await db.ref(`users/${otherUserId}`).get()).val() || {};
    
    chatHeader.textContent = `${userData.firstname} ${userData.surname}`;
    messageInput.disabled = false;
    sendBtn.disabled = false;
    
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[onclick="openChat('${chatId}')"]`).classList.add('active');
    
    // Load and listen to messages
    const messagesRef = db.ref(`messages/${chatId}`);
    messagesRef.on('value', snapshot => {
        messagesList.innerHTML = '';
        const messages = snapshot.val() || {};
        
        Object.values(messages)
            .sort((a, b) => a.timestamp - b.timestamp)
            .forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`;
                messageDiv.innerHTML = `
                    ${msg.text}
                    <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
                `;
                messagesList.appendChild(messageDiv);
            });
        
        messagesList.scrollTop = messagesList.scrollHeight;
    });
}

async function sendMessage() {
    if (!messageInput.value.trim() || !currentChatId) return;
    
    const messageRef = db.ref(`messages/${currentChatId}`).push();
    const message = {
        text: messageInput.value.trim(),
        senderId: currentUser.uid,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    await messageRef.set(message);
    
    // Update last message
    await db.ref(`chats/${currentChatId}`).update({
        lastMessage: message.text,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    messageInput.value = '';
}

async function showNewChatModal() {
    const email = prompt('Enter user email to start chat:');
    if (!email) return;
    
    try {
        const usersSnapshot = await db.ref('users').once('value');
        const users = usersSnapshot.val() || {};
        
        const targetUser = Object.entries(users)
            .find(([, data]) => data.email === email);
        
        if (!targetUser) throw new Error('User not found');
        
        const [targetUserId] = targetUser;
        if (targetUserId === currentUser.uid) throw new Error('Cannot chat with yourself');
        
        const chatId = [currentUser.uid, targetUserId].sort().join('_');
        await db.ref(`chats/${chatId}`).set({
            participants: [currentUser.uid, targetUserId],
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        openChat(chatId);
        
    } catch (error) {
        alert(error.message);
    }
}