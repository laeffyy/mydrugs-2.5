// Simple WebSocket Chat Server using 'ws' library
// Adds a server-side timestamp to messages before broadcasting.
// Run this with: node server.js

const WebSocket = require('ws');

// Create a WebSocket server instance listening on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// Store connected clients
const clients = new Set();

console.log('Servidor WebSocket iniciado na porta 8080...');
console.log('Aguardando conexões...');

// Event listener for new client connections
wss.on('connection', (ws) => {
    console.log('Novo cliente conectado');
    clients.add(ws);

    // Send a welcome message only to the newly connected client
    ws.send(JSON.stringify({ type: 'system', message: 'Bem-vindo ao chat!' }));

    // Event listener for messages received from this specific client
    ws.on('message', (message) => {
        const messageString = message.toString();
        console.log('Mensagem recebida: %s', messageString);

        try {
            // Parse the incoming message
            const parsedMessage = JSON.parse(messageString);

            // --- Basic Message Validation ---
            // Check for essential fields
            if (parsedMessage.type === 'message' && parsedMessage.nickname && parsedMessage.message) {

                // --- Add Server-Side Timestamp ---
                // Add the current time in ISO format (UTC)
                // This ensures the timestamp is consistent regardless of client's clock
                parsedMessage.timestamp = new Date().toISOString();

                // --- Re-stringify the message with the added timestamp ---
                const messageToSend = JSON.stringify(parsedMessage);

                // --- Broadcast the modified message ---
                // Send the complete message (including timestamp) to all clients
                broadcast(messageToSend, ws);

            } else {
                // Log if the message doesn't meet basic criteria
                console.log("Mensagem recebida não é do tipo 'message' ou faltam dados básicos (nickname, message).");
            }

        } catch (error) {
            console.error("Erro ao processar JSON da mensagem:", error);
            // Ignore messages that are not valid JSON
        }
    });

    // Event listener for when this client's connection is closed
    ws.on('close', (code, reason) => {
        const reasonString = reason ? reason.toString() : 'N/A';
        console.log(`Cliente desconectado. Código: ${code}, Razão: ${reasonString}`);
        clients.delete(ws); // Remove the client from the active clients Set
    });

    // Event listener for errors on this client's connection
    ws.on('error', (error) => {
        console.error('Erro no WebSocket do cliente:', error);
        // Also remove the client on error to prevent issues
        clients.delete(ws);
    });
});

// Function to broadcast a message to all connected clients
function broadcast(messageString, sender) {
    console.log(`Transmitindo mensagem para ${clients.size} clientes.`);
    clients.forEach((client) => {
        // Check if the client connection is still open before attempting to send
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageString); // Send the JSON string
        } else {
            // If the connection is closed, remove the client from the set
            console.log("Tentando enviar para cliente com conexão fechada. Removendo.");
            clients.delete(client);
        }
    });
}

// Event listener for errors on the main WebSocket server itself (less common)
wss.on('error', (error) => {
    console.error('Erro no servidor WebSocket principal:', error);
});

console.log("Configuração do servidor concluída.");
