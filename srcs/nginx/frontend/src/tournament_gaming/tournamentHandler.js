import renderTournamentWaintingPage from "./renderTournament.js";

export async function tournamentHandler(WebSocketUrl, token)
{
    const url = WebSocketUrl + `?token=${encodeURIComponent(token)}`;

    let socket, title, description, isAdmin;

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
        try
        {
            const data = JSON.parse(message.data);

            switch (data.event)
            {
                case "participant_list":
                    if (title && description && isAdmin)
                        renderTournamentWaintingPage(data.participants, title, description, isAdmin);
                    else
                        renderTournamentWaintingPage(data.participants, "Tournament", "Undefined", false);
                    break;

                case "tournament_data":
                    title = data.title;
                    description = data.description;
                    isAdmin = data.is_admin;

                default:
                    console.error("Unknown event:", data.event);
                    break;
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
}