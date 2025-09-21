document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    let conversationHistory = [];

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userMessage = userInput.value.trim();
        if (!userMessage) {
            return;
        }

        // Add user's message to the chat box
        addMessage(userMessage, 'user');
        conversationHistory.push({ role: 'user', message: userMessage });

        // Clear the input field
        userInput.value = '';

        // Show a temporary "Thinking..." message and get a reference to it
        const thinkingMessageElement = addMessage('Thinking...', 'bot');

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversation: conversationHistory,
                }),
            });

            if (!response.ok) {
                conversationHistory.pop(); // Remove user message on failure
                throw new Error('Failed to get response from server.');
            }

            const result = await response.json();

            // When the response arrives, replace the "Thinking..." message with the AI's reply
            if (result.success && result.data) {
                thinkingMessageElement.textContent = result.data;
                conversationHistory.push({ role: 'model', message: result.data });
            } else {
                conversationHistory.pop(); // Remove user message on failure
                thinkingMessageElement.textContent = 'Sorry, no response received.';
            }
        } catch (error) {
            if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'user') {
                conversationHistory.pop(); // Ensure user message is removed on any error
            }
            console.error('Error:', error);
            // If an error occurs, show an error message
            thinkingMessageElement.textContent = 'Failed to get response from server.';
        }
    });

    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = text;
        chatBox.appendChild(messageElement);
        // Scroll to the bottom to show the latest message
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageElement;
    }
});
