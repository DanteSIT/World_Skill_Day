import { auth } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

export function setupLogoutButton() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        window.location.href = 'login.html';
      } catch (error) {
        alert('Logout failed: ' + (error.message || 'Unknown error'));
      }
    });
  }
}
