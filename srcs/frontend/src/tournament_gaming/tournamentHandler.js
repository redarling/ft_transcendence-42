import renderTournamentWaintingPage from "./pages/waitingPage.js";
import showToast from "../utils/toast.js";
import renderHeader from '../components/header.js';
import renderTournaments from '../pages/tournaments/tournaments.js';
import renderTournamentBracketPage from "./pages/bracket.js";

export async function tournamentHandler(WebSocketUrl, tournamentId)
{
    const url = WebSocketUrl + `?token=${encodeURIComponent(localStorage.getItem('access_token'))}`;

    let socket, title, description, isAdmin;
    let tournamentDataPromise = new Promise((resolve) => {
        let tournamentDataReceived = false;
        let participantsData = null;

        try
        {
            socket = new WebSocket(url);
        }
        catch (error)
        {
            console.error("WebSocket error:", error);
            showToast("An error occurred while connecting to the server.", 'error');
            return;
        }

        socket.onopen = () => {
            console.log("Connected to WebSocket.");
        };

        socket.onmessage = async (message) => {
            try {
                const data = JSON.parse(message.data);
                console.log("Received message:", data);
                switch (data.event)
                {
                    case "tournament_data":
                        title = data.title;
                        description = data.description;
                        isAdmin = data.is_admin;
                        tournamentDataReceived = true;
                        break;

                    case "participant_list":
                        if (tournamentDataReceived)
                            await renderTournamentWaintingPage(socket, data.participants, title, description, isAdmin, tournamentId);
                        else
                            participantsData = data.participants;
                        break;

                    case "tournament_cancelled":
                        await renderHeader();
                        await renderTournaments();
                        showToast("Tournament has been cancelled.", 'info');
                        break;

                    case "user_left":
                        showToast("User " + data.message + " has left the tournament.", 'info');
                        break;
                    
                    case "tournament_bracket":
                        await renderTournamentBracketPage(socket, tournamentId, title, description, data.data);
                        break ;

                    default:
                        break;
                }

                if (tournamentDataReceived && participantsData)
                {
                    await renderTournamentWaintingPage(participantsData, title, description, isAdmin, tournamentId);
                    resolve();
                }
            }
            catch (error)
            {
                showToast("An error occurred while handling the tournament event.", 'error');
            }
        };

        socket.onclose = () => {
            console.log("WebSocket closed.");
        };

        socket.onerror = (error) => {
            showToast("An error occurred while connecting to the server.", 'error');
            console.error("WebSocket error:", error);
        };
    });

    await tournamentDataPromise;
}