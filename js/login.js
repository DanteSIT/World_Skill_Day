// login.js - Handles login form logic for Bridge the Gap
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('login-form');
  const authMessage = document.getElementById('auth-message');

  if (!loginForm) return;

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    authMessage.textContent = '';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      authMessage.textContent = 'Please enter both email and password.';
      return;
    }

    try {
      // Use modern Firebase v9+ syntax
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = 'dashbaord.html';
    } catch (error) {
      authMessage.textContent = error.message || 'Login failed. Please try again.';
    }
  });
});