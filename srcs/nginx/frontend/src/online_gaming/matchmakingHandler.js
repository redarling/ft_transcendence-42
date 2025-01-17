import { renderErrorPage, renderMatch, renderSearchingPage } from './renderPages.js';
import renderGame from '../pages/game.js';

export async function findMatch()
{
    const   main = document.getElementById("main");
    const   token = prompt("Please enter your JWT token:", "");
    let     playerId = null;

    if (!token)
    {
        alert("Token is required to connect.");
        return;
    }

    const   wsUrl = `wss://localhost:443/ws/matchmaking/?token=${encodeURIComponent(token)}`;
    let     socket;

    try
    {
        socket = new WebSocket(wsUrl);
    }
    catch (error)
    {
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
        try
        {
            const data = JSON.parse(message.data);

            switch (data.event)
            {
                case "searching":
                    renderSearchingPage(socket);
                    break;

                case "error":
                    renderErrorPage(data.message);
                    break;

                case "match_start":
                    if (!playerId)
                    {
                        renderErrorPage("Failed to start the match. Please try again.");
                        return;
                    }
                    const player1Username = data.match_data.player1_username;
                    const player2Username = data.match_data.player2_username;
                    const player1Avatar = data.match_data.player1_avatar;
                    const player2Avatar = data.match_data.player2_avatar;
                    renderMatch(socket, playerId, player1Username, player2Username, player1Avatar, player2Avatar, true);
                    break;
            
                case "player_id":
                    if (data.message)
                        playerId = data.message;  
                    else 
                        renderErrorPage("Failed to start the match. Please try again.");
                    break;

                default:
                    console.warn("Unhandled event:", data);
                    break;
            }
        }
        catch (e)
        {
            console.error("Error parsing message:", message, e);
        }
    };

    // Close event handler
    socket.onclose = (event) => {
        console.warn("WebSocket closed:", event);
        if (!event.wasClean)
        {
            // If socket was closed unexpectedly, notify the user
            renderErrorPage("Connection lost. Please try again.");
        }
        else
        {
            // If socket closed normally, e.g that the search was cancelled
            renderGame();
        }
    };

    // Error event handler
    socket.onerror = (error) => {
        alert("WebSocket encountered an error.");
        console.error("WebSocket error:", error);
        renderErrorPage("An unexpected error occurred. Please try again later.");
    };
}
