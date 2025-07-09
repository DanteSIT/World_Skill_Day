import { auth, database } from './firebase-config.js';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', function() {
  const signupForm = document.getElementById('signup-form');
  const authMessage = document.getElementById('auth-message');

  if (!signupForm) return;

  signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    authMessage.textContent = '';

    const firstname = document.getElementById('firstname').value.trim();
    const surname = document.getElementById('surname').value.trim();
    const email = document.getElementById('email').value.trim();
    const emailConfirm = document.getElementById('email_confirm').value.trim();  // New field
    const password = document.getElementById('password').value;
    const passwordVf = document.getElementById('password_vf').value;
    const mobile = document.getElementById('mobile_num').value.trim();
    const nin_passport = document.getElementById('nin_passport').value.trim();
    const date_of_birth = document.getElementById('date_of_birth').value.trim();
    const address = document.getElementById('address').value.trim();

    // Check for matching emails
    if (email !== emailConfirm) {
      authMessage.textContent = 'Email addresses do not match.';
      return;
    }

    // Check for matching passwords
    if (password !== passwordVf) {
      authMessage.textContent = 'Passwords do not match.';
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: `${firstname} ${surname}` });

      // Save user info to database
      await set(ref(database, 'users/' + user.uid), {
        firstname,
        surname,
        email,
        mobile,
        nin_passport,
        date_of_birth,
        address,
        createdAt: Date.now()
      });

      // Send email verification
      await sendEmailVerification(user);
      authMessage.textContent = 'Registration successful! Please check your email to verify your account.';

      // Optionally, redirect after a delay
      // setTimeout(() => window.location.href = 'login.html', 3000);
    } catch (error) {
      authMessage.textContent = error.message || 'Sign up failed. Please try again.';
    }
  });
});
