import { AreYouSureModal } from "../utils.js";
import showToast from "../../utils/toast.js";
import showLoadingSpinner from "../../utils/spinner.js";

export default async function startButton(socket, token, tournamentId)
{
    const modal = AreYouSureModal();
    document.body.appendChild(modal);

    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');

    yesBtn.addEventListener('click', () => {
        startTournament(socket, token, tournamentId);
        document.body.removeChild(modal);
    });

    noBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

async function startTournament(socket, token, tournamentId)
{
    try
    {
        showLoadingSpinner(true);
        const url = `/api/games/tournament/start/`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tournament_id: tournamentId }),
        });

        const result = await response.json();

        if (!response.ok)
            showToast(result.error || 'An unknown error occurred.', 'error');
        else
            socket.send(JSON.stringify({ event: 'tournament_start' }));
    }
    catch (error)
    {
        showToast('An error occurred while starting the tournament.', 'error');
    }
    finally
    {
        showLoadingSpinner(false);
    }
}
