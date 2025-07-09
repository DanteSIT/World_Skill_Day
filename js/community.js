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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// References
const postsRef = ref(database, 'community_posts');
const feedContainer = document.getElementById('community-feed');
const postForm = document.getElementById('post-form');
const postInput = document.getElementById('post-content');

// Load and display posts
async function loadPosts() {
    onValue(postsRef, async (snapshot) => {
        const posts = snapshot.val();
        feedContainer.innerHTML = '';
        
        if (posts) {
            // Convert to array and sort by timestamp
            const postsArray = Object.entries(posts).map(([id, post]) => ({...post, id}));
            postsArray.sort((a, b) => b.timestamp - a.timestamp);

            for (const post of postsArray) {
                try {
                    // Get author info for each post
                    const authorSnap = await get(ref(database, `users/${post.authorId}`));
                    const authorData = authorSnap.val();
                    post.authorName = authorData ? `${authorData.firstname} ${authorData.surname}` : 'Unknown User';
                    
                    const postElement = createPostElement(post);
                    feedContainer.appendChild(postElement);
                } catch (error) {
                    console.error('Error loading author data:', error);
                }
            }
        }
    });
}

// Create post element
function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post';
    
    div.innerHTML = `

        <br>
        <div class="post-header">
            <span class="post-author">${post.authorName || 'Unknown User'}</span>
            <span class="post-time">${formatTimestamp(post.timestamp)}</span>
        </div>
        <div class="post-content">${post.content}</div>

    `;
    
    return div;
}

// Handle post submission
async function handlePostSubmit(e) {
    e.preventDefault();
    const content = postInput.value.trim();
    if (!content) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
        // Get current user data
        const userSnap = await get(ref(database, `users/${user.uid}`));
        const userData = userSnap.val();
        
        if (!userData) {
            console.error('User data not found');
            return;
        }

        await push(postsRef, {
            content,
            authorId: user.uid,
            timestamp: Date.now()
        });

        postInput.value = '';
    } catch (error) {
        console.error('Error posting:', error);
    }
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadPosts();
            if (postForm) {
                postForm.addEventListener('submit', handlePostSubmit);
            }
        } else {
            window.location.href = 'login.html';
        }
    });
});