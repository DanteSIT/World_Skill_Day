// Firebase imports and config from script.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getDatabase, ref, onValue, get } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js';

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

// Public data structure
const publicDataStructure = {
    users: {
        public: ['firstname', 'surname', 'createdAt'],
        private: ['email', 'mobile', 'nin_passport', 'address']
    }
};

// Load public user data
export function loadPublicUserData(container, userId = null) {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        if (!users) return;

        const publicData = Object.entries(users).map(([uid, userData]) => ({
            uid,
            ...filterPublicData(userData)
        }));

        if (userId) {
            displaySingleUserData(container, publicData.find(user => user.uid === userId));
        } else {
            displayAllUsersData(container, publicData);
        }
    });
}

// Filter data based on public/private fields
function filterPublicData(userData) {
    const publicData = {};
    publicDataStructure.users.public.forEach(field => {
        if (userData[field]) {
            publicData[field] = userData[field];
        }
    });
    return publicData;
}

// Display single user's public data
function displaySingleUserData(container, userData) {
    if (!userData) return;
    
    container.innerHTML = `
        <div class="user-card">
            <h2>${userData.firstname} ${userData.surname}</h2>
            <p>Member since: ${formatDate(userData.createdAt)}</p>
        </div>
    `;
}

// Display all users' public data
function displayAllUsersData(container, usersData) {
    container.innerHTML = usersData
        .map(user => `
            <div class="user-card">
                <h3>${user.firstname} ${user.surname}</h3>
                <p>Member since: ${formatDate(user.createdAt)}</p>
                <button onclick="viewProfile('${user.uid}')" class="view-profile-btn">
                    View Profile
                </button>
            </div>
        `)
        .join('');
}

// Format date helper
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Export functions for use in other files
export { filterPublicData };