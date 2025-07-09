
// Store page history in sessionStorage
function storePageVisit() {
    const currentPage = window.location.pathname;
    const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
    
    // Don't add if it's the same as the last page
    if (history[history.length - 1] !== currentPage) {
        history.push(currentPage);
        sessionStorage.setItem('pageHistory', JSON.stringify(history));
    }
}

// Go back to previous page
function goBack() {
    const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
    if (history.length > 1) {
        history.pop(); // Remove current page
        const previousPage = history[history.length - 1];
        sessionStorage.setItem('pageHistory', JSON.stringify(history));
        window.location.href = previousPage;
    } else {
        window.location.href = '/dashbaord.html'; // Default fallback
    }
}

// Add back button to page
function addBackButton() {
    const button = document.createElement('button');
    button.id = 'back-btn';
    button.innerHTML = '← Back';
    button.onclick = goBack;
    document.body.appendChild(button);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Ensure all main UI panels are visible
    const mainContent = document.querySelector('.main-content');
    const chatContainer = document.querySelector('.chat-container');
    const aiMentorContainer = document.querySelector('.ai-mentor-container');

    if (mainContent) mainContent.classList.remove('hidden');
    if (chatContainer) chatContainer.classList.remove('hidden');
    if (aiMentorContainer) aiMentorContainer.classList.remove('hidden');

    // Add navigation logic if needed
    // Example: Highlight active link in the sidebar
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        if (link.href.includes(currentPath)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    storePageVisit();
    addBackButton();
});
