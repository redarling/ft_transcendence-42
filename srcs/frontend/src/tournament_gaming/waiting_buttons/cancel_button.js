import { showToast } from "../utils.js";

export default async function cancelButton(socket, token, tournament_id)
{
    const modal = CancelModal();
    document.body.appendChild(modal);

    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');

    yesBtn.addEventListener('click', () => {
        cancelTournament(socket, token, tournament_id);
        document.body.removeChild(modal);
    });

    noBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

function CancelModal()
{
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header d-flex justify-content-center align-items-center">
                <h5 class="modal-title">Are you sure?</h5>
            </div>
            <div class="modal-body d-flex justify-content-center">
                <button type="button" class="btn btn-success" id="yesBtn">Yes</button>
                <button type="button" class="btn btn-danger" id="noBtn" style="margin-left: 10px;">No</button>
            </div>
        </div>
    `;
    return modal;
}


async function cancelTournament(socket, token, tournamentId)
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

    if (!response.ok)
    {
        const result = await response.json();
        showToast(result.error, 'error');
    }

    // send via socket that the tournament has been cancelled
    socket.send(JSON.stringify({event: 'tournament_cancelled', tournament_id: tournamentId}));
}