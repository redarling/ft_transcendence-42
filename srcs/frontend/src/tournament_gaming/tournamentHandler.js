import renderTournamentWaintingPage from "./renderTournament.js";
import { showToast } from './utils.js';
import renderHeader from '../components/header.js';
import renderTournaments from '../pages/tournaments/tournaments.js';

export async function tournamentHandler(WebSocketUrl, token, tournamentId)
{
    const url = WebSocketUrl + `?token=${encodeURIComponent(token)}`;

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
            console.error("WebSocket error:", error); // add error page/alert
            return;
        }

        socket.onopen = () => {
            console.log("Connected to WebSocket.");
        };

        socket.onmessage = (message) => {
            try {
                const data = JSON.parse(message.data);

                switch (data.event)
                {
                    case "tournament_data":
                        console.log("Received tournament data:", data);
                        title = data.title;
                        description = data.description;
                        isAdmin = data.is_admin;
                        tournamentDataReceived = true;
                        break;

                    case "participant_list":
                        if (tournamentDataReceived)
                            renderTournamentWaintingPage(socket, token, data.participants, title, description, isAdmin, tournamentId);
                        else
                            participantsData = data.participants;
                        break;
                    
                    case "tournament_cancelled":
                        console.log("Tournament cancelled.");
                        renderHeader();
                        renderTournaments();
                        showToast("Tournament has been cancelled.", 'error');
                        break;

                    default:
                        console.error("Unknown event:", data.event);
                        break;
                }

                if (tournamentDataReceived && participantsData)
                {
                    renderTournamentWaintingPage(token, participantsData, title, description, isAdmin, tournamentId);
                    resolve();
                }
            }
            catch (error)
            {
                console.error("Error parsing message:", error); // add error page/alert
            }
        };

        socket.onclose = () => {
            console.log("WebSocket closed."); // add error page/alert
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error); // add error page/alert
        };
    });

    await tournamentDataPromise;
}