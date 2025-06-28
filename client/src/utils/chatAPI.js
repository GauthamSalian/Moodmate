export async function sendChatToFastAPI(userInput) {
  try {
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_input: userInput }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('FastAPI error:', error);
    return { response: "⚠️ Failed to connect to server." };
  }
}
