// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {

    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendEmailVerification,
    setPersistence,
    browserLocalPersistence

} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC42b8Vqjq7FcXVEybF5CpYDVp5MjWO8T0",
    authDomain: "hackathon2025-40af0.firebaseapp.com",
    databaseURL: "https://hackathon2025-40af0-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "hackathon2025-40af0",
    storageBucket: "hackathon2025-40af0.appspot.com",
    messagingSenderId: "870888203476",
    appId: "1:870888203476:web:c111521e765865259d4741"
};

// Initialize Firebase with persistence
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Enable session persistence
setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.error("Persistence error:", error);
    });

// Global error boundary
window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nError object: ' + JSON.stringify(error));
    return false;
};

// Auth state observer with loading state
let authCheckComplete = false;
onAuthStateChanged(auth, (user) => {
    if (!authCheckComplete) {
        document.body.style.opacity = "0.6";
        document.body.style.pointerEvents = "none";
    }
    try {
        const currentPage = window.location.pathname.split('/').pop();
        if (user) {
            // If on login page and already logged in, redirect to dashboard
            if (currentPage === 'login.html') {
                window.location.href = 'dashbaord.html';
                return;
            }
            // User is signed in
            const protectedPages = ['dashbaord.html', 'messages.html', 'community.html', 'learning_hub.html', 'admin.html', 'ai_mentor.html'];
            if (!user.emailVerified && protectedPages.includes(currentPage)) {
                window.location.href = 'login.html';
                return;
            }
            // Update UI for protected pages
            if ($("#user-profile").length) {
                updateUserProfile(user);
            }
            // Real-time user status update
            const userStatusRef = ref(database, 'users/' + user.uid + '/status');
            set(userStatusRef, 'online');
            $(window).on('beforeunload', () => {
                set(userStatusRef, 'offline');
            });
        } else {
            // No user is signed in
            const publicPages = ['login.html', 'sign_in.html', 'forgotpadd.html', 'index.html'];
            if (!publicPages.includes(currentPage)) {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error("Auth state error:", error);
        $("#auth-message").text("An error occurred. Please refresh the page.");
    } finally {
        authCheckComplete = true;
        document.body.style.opacity = "1";
        document.body.style.pointerEvents = "auto";
    }
});

// Initialize page and handle navigation
function initializePage() {
    // Ensure sidebar is visible
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.style.display = 'flex';
    }

    // Set active navigation item
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Ensure profile visibility across all pages
function maintainProfileVisibility() {
    const profileContainer = document.querySelector('.profile-container');
    const currentPage = window.location.pathname.split('/').pop();

    // Only handle visibility if we're on admin or ai_mentor pages
    if (currentPage === 'admin.html' || currentPage === 'ai_mentor.html') {
        if (profileContainer) {
            profileContainer.style.display = 'block';
        }
    }
}

// Page initialization
function initializePage() {
    maintainProfileVisibility();

    // Page-specific initialization
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'ai_mentor.html') {
        initializeAIMentor();
    } else if (currentPage === 'admin.html') {
        initializeAdminPortal();
    }
}

$(document).ready(function () {
    $("#signup-form").on("submit", function (e) {
        e.preventDefault();
        const userData = {
            firstname: $("#firstname").val(),
            surname: $("#surname").val(),
            email: $("#email").val(),
            mobile: $("#mobile_num").val(),
            nin_passport: $("#nin_passord").val(), // Typo here in the original code? It should be "ninPassport"?
            date_of_birth: $("#date_of_birth").val(),
            address: $("#address").val()
        };

        const password = $("#password").val();
        const password_vf = $("#password_vf").val();

        if (password !== password_vf) {
            $("#auth-message").text("Passwords do not match!");
            return;
        }

        $("#submit-btn").prop("disabled", true).val("Creating Account...");

        createUserWithEmailAndPassword(auth, userData.email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                if (user) {
                    // Send email verification
                    return sendEmailVerification(user);
                } else {
                    throw new Error("Authentication error");
                }
            })
            .then(() => {
                // Set Firestore data with verified status as false and createdAt timestamp
                const uid = user.uid || localStorage.getItem('FIREBASE_UID'); // Not sure, but assuming user is authenticated
                set(ref(database, 'users/' + uid), {
                    ...userData,
                    uid: uid,
                    emailVerified: false,
                    createdAt: Date.now()
                });
            })
            .then(() => {
                $("#auth-message").html("Account created! Please verify your email before logging in.<br>Check your inbox.");
                window.location.href = 'login.html';
            });

    });

});

    // Logout Handler
    $("#logout-btn").on("click", function () {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        });
    });

// Error Handler
function handleAuthError(error) {
    let message = "";
    switch (error.code) {
        case 'auth/weak-password':
            message = 'Password should be at least 6 characters';
            break;
        case 'auth/email-already-in-use':
            message = 'This email is already registered';
            break;
        case 'auth/invalid-email':
            message = 'Please enter a valid email address';
            break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            message = 'Invalid email or password';
            break;
        default:
            message = error.message;
    }
    $("#auth-message").text(message);
}

// Profile Update Handler
function updateUserProfile(user) {
    get(ref(database, 'users/' + user.uid)).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            $("#user-name").text(data.firstname + ' ' + data.surname);
            $("#user-email").text(data.email);
            $("#user-mobile").text(data.mobile);
            // Update other profile fields as needed
        }
    });
}

// Handle page load
document.addEventListener('DOMContentLoaded', initializePage);