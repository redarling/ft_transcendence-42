import { AreYouSureModal } from "../utils.js";
import showToast from "../../utils/toast.js";

export default async function cancelButton(socket, token, tournamentId)
{
    const modal = AreYouSureModal();
    document.body.appendChild(modal);

    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');

    yesBtn.addEventListener('click', () => {
        cancelTournament(socket, token, tournamentId);
        document.body.removeChild(modal);
    });

    noBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

async function cancelTournament(socket, token, tournamentId)
{
    try
    {
        const url = `/api/games/tournament/cancel/`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tournament_id: tournamentId
            }),
        });
    
        let result;
        try
        {
            result = await response.json();
        }
        catch
        {
            result = { error: 'Unexpected server response' };
        }
        
        if (!response.ok)
            showToast(result.error, 'error');
        else
            socket.send(JSON.stringify({event: 'tournament_cancelled'}));
    }
    catch (error)
    {
        showToast('An error occurred while canceling the tournament.', 'error');
    }
}