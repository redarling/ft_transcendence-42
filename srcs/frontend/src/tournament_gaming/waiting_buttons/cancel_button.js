import { AreYouSureModal } from "../utils.js";
import showToast from "../../utils/toast.js";
import showLoadingSpinner from "../../utils/spinner.js";

export default async function cancelButton(socket, tournamentId)
{
    const modal = AreYouSureModal();
    document.body.appendChild(modal);

    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');

    yesBtn.addEventListener('click', () => {
        cancelTournament(socket, tournamentId);
        document.body.removeChild(modal);
    });

    noBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

export async function cancelTournament(socket, tournamentId)
{
    try
    {
        const token = localStorage.getItem('access_token');
        if (!token)
        {
            throw new Error('Unauthorized.');
        }

        showLoadingSpinner(true);
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
    
        const result = await response.json();
        
        if (!response.ok)
        {
            const errorMsg = result.error || result.detail || 'No tournaments available.';
            showToast(errorMsg, 'error');
        }
        else
            socket.send(JSON.stringify({event: 'tournament_cancelled'}));
    }
    catch (error)
    {
        showToast('An error occurred while canceling the tournament.', 'error');
    }
    finally
    {
        showLoadingSpinner(false);
    }
}