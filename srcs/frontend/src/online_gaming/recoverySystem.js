import { fetchWithAuth } from '../utils/fetchWithAuth.js';
import { renderErrorPage, renderMatch, handleMatchOver } from './renderPages.js';

export async function checkActiveMatch()
{
    try
    {
        console.log("- function: checkActiveMatch");
        const response = await fetchWithAuth("/api/games/check-active-match/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok)
            throw new Error(`API returned status ${response.status}`);

        const data = await response.json();
        return data;
    }
    catch (error)
    {
        console.error("Error checking active match:", error);
        return null;
    }
}

export async function checkActiveTournament()
{
    try
    {
        console.log("- function: checkActiveTournament");
        const response = await fetchWithAuth("/api/games/check-active-tournament/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        });

        if (!response.ok)
            throw new Error(`API returned status ${response.status}`);

        const data = await response.json();
        return data;
    }
    catch (error)
    {
        console.error("Error checking active tournament:", error);
        return null;
    }
}

export async function connectToWebSocket(matchGroup)
{
    const wsUrl = `wss://transcendence-pong:7443/ws/matchmaking/?token=${encodeURIComponent(localStorage.getItem('access_token'))}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log("WebSocket connected.");
        socket.send(JSON.stringify({
            event: "recover_match",
            matchGroup: matchGroup,
        }));
    };

    socket.onerror = (error) => {
        renderErrorPage("An unexpected error occurred. Please try again later.");
        console.error("WebSocket error:", error);
    };

    socket.onmessage = (event) => {
        console.log("WebSocket message received:", event.data);
        const data = JSON.parse(event.data);
        try
        {
            switch (data.event)
            {
                case "match_recovered":
                    let playerId;
                    if (data.player2_username === data.opponentUsername)
                        playerId = data.player1_id;
                    else
                        playerId = data.player2_id;
                    console.log("Match recovered:", data.player1_username, data.player2_username);
                    renderMatch(socket, playerId, data.player1_username, data.player2_username, data.player1_avatar, data.player2_avatar, false);
                    break;
            
                case "match_over":
                    handleMatchOver(data, playerId);
                    break;

                default:
                    console.warn("Unhandled event:", data);
            }
        }
        catch (e)
        {
            console.error("Error parsing message:", message, e);
        }
    };

    socket.onclose = () => {
        console.log("WebSocket closed.");
        renderErrorPage("Connection lost. Please try again.");
    };

    return socket;
}
