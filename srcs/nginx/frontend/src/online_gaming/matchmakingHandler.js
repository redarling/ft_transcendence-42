import { renderErrorPage, renderMatch, renderSearchingPage, handleMatchOver } from './renderPages.js';

export async function findMatch() {
    const main = document.getElementById("main");
    const token = prompt("Please enter your JWT token:", "");
    let playerId = null;

    if (!token) {
        alert("Token is required to connect.");
        return;
    }

    // Connect to the WebSocket
    const wsUrl = `wss://localhost:443/ws/matchmaking/?token=${encodeURIComponent(token)}`;
    let socket;

    try {
        socket = new WebSocket(wsUrl);
    } catch (error) {
        alert("Failed to connect to the server. Please try again later.");
        console.error("WebSocket error:", error);
        return;
    }

    // Send a message to the server to start searching a match
    socket.onopen = () => {
        console.log("Connected to WebSocket.");
        socket.send(JSON.stringify({ event: "start_search" }));
    };

    // Server's message event handler
    socket.onmessage = (message) => {
        try {
            const data = JSON.parse(message.data);

            switch (data.event) {
                case "searching":
                    renderSearchingPage(socket);
                    break;

                case "error":
                    renderErrorPage(data.message);
                    break;

                case "match_start":
                    if (!playerId) {
                        console.error("playerId is not defined before starting the match.");
                        renderErrorPage("Failed to start the match. Please try again.");
                        return;
                    }
                    renderMatch(socket, playerId);
                    break;
                
                case "match_over":
                    handleMatchOver(data, playerId);
                    break;
            
                case "player_id":
                    if (data.message)
                        playerId = data.message;  
                    else 
                        renderErrorPage("Failed to start the match. Please try again.");
                    break;

                default:
                    console.warn("Unhandled event:", data);
            }
        } catch (e) {
            console.error("Error parsing message:", message, e);
        }
    };

    // Close event handler
    socket.onclose = (event) => {
        console.warn("WebSocket closed:", event);
        if (!event.wasClean) {
            // If socket was closed unexpectedly, notify the user
            renderErrorPage("Connection lost. Please try again.");
        } else {
            // If socket closed normally, inform the user that the search was cancelled
            renderErrorPage("The search has been cancelled.");
        }
    };

    // Error event handler
    socket.onerror = (error) => {
        alert("WebSocket encountered an error.");
        console.error("WebSocket error:", error);
        renderErrorPage("An unexpected error occurred. Please try again later.");
    };
}
