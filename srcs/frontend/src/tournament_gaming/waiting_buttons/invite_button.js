import { showToast } from '../utils.js';

export default async function inviteButton(token, tournamentId)
{
    const modal = friendsListModal();
    document.body.appendChild(modal);

    const closeModalBtn = document.getElementById('closeModalBtn');
    const friendsList = document.getElementById('friendsList');

    closeModalBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    try
    {
        const friends = await fetchFriendsList(token, tournamentId);
        renderFriendsList(token, friends, friendsList, tournamentId);
    }
    catch (error)
    {
        friendsList.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

function friendsListModal()
{
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header d-flex justify-content-between align-items-center">
                <h5 class="modal-title">Invite Friends</h5>
                <button type="button" class="btn-close" id="closeModalBtn" aria-label="Close">×</button>
            </div>
            <div class="modal-body">
                <div id="friendsList" class="search-results"></div>
            </div>
        </div>
    `;
    return modal;
}

async function fetchFriendsList(token, tournamentId)
{
    const url = `/api/games/friend-list/tournament/invite/?tournament_id=${tournamentId}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok)
    {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch friends list.');
    }

    return await response.json();
}

function renderFriendsList(token, friends, friendsList, tournamentId)
{
    friendsList.innerHTML = '';

    if (friends.length === 0)
    {
        friendsList.innerHTML = '<p>No friends available to invite.</p>';
        return;
    }

    friends.forEach((friend) => {
        const friendElement = document.createElement('div');
        friendElement.className = 'tournament-item';
        friendElement.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${friend.avatar}" alt="${friend.username}" class="avatar" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
                <span>${friend.username}</span>
                <button class="btn btn-primary btn-sm ml-auto invite-friend-btn" data-id="${friend.id}">Invite</button>
            </div>
        `;
        friendsList.appendChild(friendElement);
    });

    document.querySelectorAll('.invite-friend-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const friendId = button.getAttribute('data-id');
            inviteFriend(token, friendId, tournamentId);
        });
    });
}

async function inviteFriend(token, friendId, tournamentId)
{
    try
    {
        const response = await fetch('/api/games/tournament/invite/', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                tournament_id: tournamentId,
                friend_id: friendId,
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

        console.log(result);

        if (response.ok)
        {
            showToast(result.message, 'success');
        }
        else
        {
            showToast(result.error, 'error');
        }
    }
    catch (error)
    {
        showToast('An error occurred while sending the invitation.', 'error');
    }
}