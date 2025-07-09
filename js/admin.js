import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getDatabase, ref, get, remove, set } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js';

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

const ADMIN_CODE = '2745532';
let isAdmin = false;

function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('admin-message');
    if (!messageDiv) return;

    messageDiv.textContent = message;
    messageDiv.className = `admin-message ${type}`;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

function verifyAdmin(code) {
    if (code === ADMIN_CODE) {
        isAdmin = true;
        document.getElementById('admin-verify').classList.add('hidden');
        document.getElementById('admin-controls').classList.remove('hidden');
        showMessage('Admin verification successful', 'success');
        loadAdminData();
    } else {
        showMessage('Invalid admin code', 'error');
    }
}

async function loadAdminData() {
    if (!isAdmin) return;
    
    try {
        // Load Users
        const usersSnap = await get(ref(database, 'users'));
        const usersList = document.getElementById('users-list');
        if (usersList && usersSnap.exists()) {
            usersList.innerHTML = '';
            Object.entries(usersSnap.val()).forEach(([uid, userData]) => {
                const userDiv = document.createElement('div');
                userDiv.className = 'admin-item';
                userDiv.innerHTML = `
                    <div class="item-info">
                        <span>${userData.firstname} ${userData.surname}</span>
                        <span>${userData.email}</span>
                    </div>
                    <button class="delete-btn" data-type="user" data-id="${uid}">Delete</button>
                `;
                usersList.appendChild(userDiv);
            });
        }

        // Load Messages
        const messagesSnap = await get(ref(database, 'direct_messages'));
        const messagesList = document.getElementById('messages-list');
        if (messagesList && messagesSnap.exists()) {
            messagesList.innerHTML = '';
            Object.entries(messagesSnap.val()).forEach(([chatId, messages]) => {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'admin-item';
                messageDiv.innerHTML = `
                    <div class="item-info">
                        <span>Chat ID: ${chatId}</span>
                        <span>${Object.keys(messages).length} messages</span>
                    </div>
                    <button class="delete-btn" data-type="chat" data-id="${chatId}">Delete</button>
                `;
                messagesList.appendChild(messageDiv);
            });
        }

        // Load Posts
        const postsSnap = await get(ref(database, 'community_posts'));
        const postsList = document.getElementById('posts-list');
        if (postsList && postsSnap.exists()) {
            postsList.innerHTML = '';
            Object.entries(postsSnap.val()).forEach(([postId, post]) => {
                const postDiv = document.createElement('div');
                postDiv.className = 'admin-item';
                postDiv.innerHTML = `
                    <div class="item-info">
                        <span>${post.authorName}</span>
                        <span>${new Date(post.timestamp).toLocaleDateString()}</span>
                    </div>
                    <button class="delete-btn" data-type="post" data-id="${postId}">Delete</button>
                `;
                postsList.appendChild(postDiv);
            });
        }
    } catch (error) {
        console.error('Error loading admin data:', error);
        showMessage('Error loading data', 'error');
    }
}

async function deleteItem(type, id) {
    if (!isAdmin) return;

    try {
        let path;
        switch (type) {
            case 'user':
                path = `users/${id}`;
                break;
            case 'chat':
                path = `direct_messages/${id}`;
                break;
            case 'post':
                path = `community_posts/${id}`;
                break;
            default:
                return;
        }

        await remove(ref(database, path));
        showMessage(`${type} deleted successfully`, 'success');
        loadAdminData();
    } catch (error) {
        console.error('Error deleting item:', error);
        showMessage('Error deleting item', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const verifyBtn = document.getElementById('verify-btn');
    const adminCode = document.getElementById('admin-code');

    verifyBtn?.addEventListener('click', () => {
        verifyAdmin(adminCode?.value || '');
    });

    adminCode?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyAdmin(adminCode.value);
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const type = e.target.dataset.type;
            const id = e.target.dataset.id;
            if (confirm(`Are you sure you want to delete this ${type}?`)) {
                deleteItem(type, id);
            }
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });
});