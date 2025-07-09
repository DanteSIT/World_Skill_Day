// AI Mentor Functionality
const aiMessageInput = document.getElementById('ai-message-input');
const aiSendBtn = document.getElementById('ai-send-btn');
const aiChatMessages = document.getElementById('ai-chat-messages');

// Mock AI response function
function getAIResponse(userMessage) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`AI Mentor Response to: "${userMessage}"`);
        }, 1000);
    });
}

// Send message
async function sendAIMessage() {
    const userMessage = aiMessageInput.value.trim();
    if (!userMessage) return;

    // Display user message
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message sent';
    userMessageDiv.innerHTML = `<div class="message-content">${userMessage}</div>`;
    aiChatMessages.appendChild(userMessageDiv);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

    aiMessageInput.value = '';

    // Get AI response
    const aiResponse = await getAIResponse(userMessage);

    // Display AI response
    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.className = 'message received';
    aiMessageDiv.innerHTML = `<div class="message-content">${aiResponse}</div>`;
    aiChatMessages.appendChild(aiMessageDiv);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

// Event listener
aiSendBtn.addEventListener('click', sendAIMessage);
aiMessageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAIMessage();
    }
});