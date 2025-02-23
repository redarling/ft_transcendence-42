import { renderErrorPage, renderMatch, renderSearchingPage } from './renderPages.js';
import renderGame from '../pages/game.js';
import showToast from '../utils/toast.js';

export async function findMatch()
{
    let playerId = null;

    const   wsUrl = `wss://transcendence-pong:7443/ws/matchmaking/?token=${encodeURIComponent(localStorage.getItem('access_token'))}`;
    let     socket;

    try
    {
        socket = new WebSocket(wsUrl);
    }
    catch (error)
    {
        showToast("Failed to connect to the server. Please try again later.", "error");
        console.error("WebSocket error:", error);
        return;
    }

    // Send a message to the server to start searching a match
    socket.onopen = () => {
        console.log("Connected to WebSocket.");
        socket.send(JSON.stringify({ event: "start_search" }));
    };

    // Server's message event handler
    socket.onmessage = async (message) => {
        try
        {
            const data = JSON.parse(message.data);

            switch (data.event)
            {
                case "searching":
                    await renderSearchingPage(socket);
                    break;

                case "error":
                    await renderErrorPage(data.message);
                    break;

                case "match_start":
                    if (!playerId)
                    {
                        await renderErrorPage("Failed to start the match. Please try again.");
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
                        await renderErrorPage("Failed to start the match. Please try again.");
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
    socket.onclose = async (event) => {
        console.warn("WebSocket closed:", event);
        if (!event.wasClean)
        {
            // If socket was closed unexpectedly, notify the user
            await renderErrorPage("Connection lost. Please try again.");
        }
        else
        {
            // If socket closed normally, e.g that the search was cancelled
            await renderGame();
        }
    };

    // Error event handler
    socket.onerror = async (error) => {
        showToast("Failed to connect to the server. Please try again later.", "error");
        console.error("WebSocket error:", error);
        await renderErrorPage("An unexpected error occurred. Please try again later.");
    };
}
