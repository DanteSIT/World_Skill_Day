// profile.js - User profile management
import { auth, database } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { ref, set, get } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js';

function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('auth-message');
    if (!messageDiv) return;

    messageDiv.textContent = message;
    messageDiv.className = `auth-message ${type}`;
    messageDiv.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

async function loadProfile() {
    const user = auth.currentUser;
    if (!user) {
        console.log('No user logged in');
        return;
    }

    try {
        const snapshot = await get(ref(database, `users/${user.uid}`));
        const userData = snapshot.val();
        
        if (!userData) {
            showMessage('No profile data found', 'error');
            return;
        }

        // Update profile view sections
        const personalInfo = document.getElementById('personal-info');
        const contactInfo = document.getElementById('contact-info');

        if (personalInfo) {
            personalInfo.innerHTML = `
                <p><strong>Name:</strong> ${userData.firstname || 'N/A'} ${userData.surname || 'N/A'}</p>
                <p><strong>Date of Birth:</strong> ${userData.date_of_birth || 'N/A'}</p>
                <p><strong>NIN/Passport:</strong> ${userData.nin_passport || 'N/A'}</p>
            `;
        }

        if (contactInfo) {
            contactInfo.innerHTML = `
                <p><strong>Email:</strong> ${userData.email || user.email}</p>
                <p><strong>Mobile:</strong> ${userData.mobile || 'N/A'}</p>
                <p><strong>Address:</strong> ${userData.address || 'N/A'}</p>
            `;
        }

        // Populate edit form with current data
        const fields = ['firstname', 'surname', 'date_of_birth', 'mobile', 'address', 'nin_passport'];
        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                input.value = userData[field] || '';
            }
        });

        // Set email (readonly)
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = userData.email || user.email;
        }

        console.log('Profile loaded successfully');
    } catch (error) {
        console.error('Error loading profile:', error);
        showMessage('Failed to load profile data: ' + error.message, 'error');
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const user = auth.currentUser;
    
    if (!user) {
        showMessage('Please log in to update your profile', 'error');
        return;
    }

    const password = document.getElementById('verify-password').value.trim();
    if (!password) {
        showMessage('Please enter your password to verify changes', 'error');
        return;
    }

    // Disable submit button to prevent double submission
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';

    try {
        // Verify password first
        await signInWithEmailAndPassword(auth, user.email, password);

        // Collect updated profile data
        const updatedData = {
            firstname: document.getElementById('firstname').value.trim(),
            surname: document.getElementById('surname').value.trim(),
            email: user.email, // Keep original email
            date_of_birth: document.getElementById('date_of_birth').value,
            mobile: document.getElementById('mobile').value.trim(),
            address: document.getElementById('address').value.trim(),
            nin_passport: document.getElementById('nin_passport').value.trim(),
            lastUpdated: Date.now(),
            uid: user.uid // Preserve uid
        };

        // Validate required fields
        if (!updatedData.firstname || !updatedData.surname) {
            throw new Error('First name and surname are required');
        }

        // Update database
        await set(ref(database, `users/${user.uid}`), updatedData);
        
        // Switch back to view mode
        document.getElementById('profile-form').classList.add('hidden');
        document.getElementById('profile-view').classList.remove('hidden');
        
        // Clear password field
        document.getElementById('verify-password').value = '';
        
        showMessage('Profile updated successfully!', 'success');
        
        // Reload profile data to reflect changes
        await loadProfile();
        
    } catch (error) {
        console.error('Profile update error:', error);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            showMessage('Invalid password. Please try again.', 'error');
        } else {
            showMessage('Failed to update profile: ' + error.message, 'error');
        }
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function toggleEditMode() {
    const profileForm = document.getElementById('profile-form');
    const profileView = document.getElementById('profile-view');
    
    if (profileForm && profileView) {
        profileForm.classList.remove('hidden');
        profileView.classList.add('hidden');
        
        // Clear any previous password
        const passwordField = document.getElementById('verify-password');
        if (passwordField) {
            passwordField.value = '';
        }
    }
}

function cancelEdit() {
    const profileForm = document.getElementById('profile-form');
    const profileView = document.getElementById('profile-view');
    
    if (profileForm && profileView) {
        profileForm.classList.add('hidden');
        profileView.classList.remove('hidden');
        
        // Clear password field
        const passwordField = document.getElementById('verify-password');
        if (passwordField) {
            passwordField.value = '';
        }
        
        // Reload original data
        loadProfile();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Profile page initializing...');
    
    // Set up event listeners
    const editBtn = document.getElementById('edit-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit');
    const profileForm = document.getElementById('profile-form');

    if (editBtn) {
        editBtn.addEventListener('click', toggleEditMode);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelEdit);
    }

    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Listen for auth state changes
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('User authenticated:', user.email);
            await loadProfile();
        } else {
            console.log('No user authenticated, redirecting to login');
            window.location.href = 'login.html';
        }
    });
});