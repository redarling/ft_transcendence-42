export default async function invitationsList(token)
{
    const modal = createInvitationsModal();
    document.body.appendChild(modal);

    const closeModalBtn = document.getElementById('closeModalBtn');
    const invitationsList = document.getElementById('invitationsList');

    closeModalBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    try
    {
        const invitations = await fetchInvitations(token);
        renderInvitations(invitations, invitationsList);
    }
    catch (error)
    {
        invitationsList.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

function createInvitationsModal()
{
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header d-flex justify-content-between align-items-center">
                <h5 class="modal-title">My Invitations</h5>
                <button type="button" class="btn-close" id="closeModalBtn" aria-label="Close">×</button>
            </div>
            <div class="modal-body">
                <div id="invitationsList" class="search-results"></div>
            </div>
        </div>
    `;
    return modal;
}

async function fetchInvitations(token)
{
    const url = "https://transcendence-pong:7443/api/games/tournament-invitation-list/";
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok)
    {
        throw new Error(response.statusText);
    }

    return await response.json();
}

function renderInvitations(invitations, invitationsList)
{
    invitationsList.innerHTML = '';

    if (invitations.length === 0)
    {
        invitationsList.innerHTML = '<p>No active invitations found.</p>';
        return;
    }

    invitations.forEach((invitation) => {
        const invitationElement = document.createElement('div');
        invitationElement.className = 'tournament-item';
        invitationElement.innerHTML = `
            <h5>${invitation.title}</h5>
            <p>${invitation.description}</p>
            <p>Invited by: <strong>${invitation.invited_by}</strong></p>
            <button class="btn btn-secondary join-tournament-btn" data-id="${invitation.tournament_id}">Join</button>
        `;
        invitationsList.appendChild(invitationElement);
    });

    document.querySelectorAll('.join-tournament-btn').forEach((button) => {
        button.addEventListener('click', () => {
            alert('Join functionality is not implemented yet.');
        });
    });
}