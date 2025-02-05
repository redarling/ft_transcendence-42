import { showToast, AreYouSureModal } from "../utils.js";
import renderHeader from '../../components/header.js';
import renderTournaments from '../../pages/tournaments/tournaments.js';
export default async function leaveButton(socket, token, tournamentId)
{
    const modal = AreYouSureModal();
    document.body.appendChild(modal);

    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');

    yesBtn.addEventListener('click', () => {
        leaveTournament(socket, token, tournamentId);
        document.body.removeChild(modal);
    });

    noBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

async function leaveTournament(socket, token, tournamentId)
{
    try
    {
        const url = `/api/games/tournament/leave/`;
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
            showToast(result.error, 'error');
        else
        {
            socket.send(JSON.stringify({event: 'user_left'}));
            renderHeader();
            renderTournaments();
        }
    }
    catch (error)
    {
        showToast('An error occurred while leaving the tournament.', 'error');
    }
}