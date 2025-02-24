import showToast from "../../utils/toast.js";
import showLoadingSpinner from "../../utils/spinner.js";
import { fetchWithAuth } from "../../utils/fetchWithAuth.js";

export default async function inviteButton(tournamentId)
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
        const friends = await fetchFriendsList(tournamentId);
        console.log(friends);
        renderFriendsList(friends, friendsList, tournamentId);
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
                <button id="closeModalBtn" type="button" class="btn-close" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div id="friendsList" class="search-results"></div>
            </div>
        </div>
    `;
    return modal;
}

async function fetchFriendsList(tournamentId)
{
    try
    {
        showLoadingSpinner(true);
        const url = `/api/games/friend-list/tournament/invite/?tournament_id=${tournamentId}`;
        const response = await fetchWithAuth(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();
        if (!response.ok)
            throw new Error(result.error || res|| 'No friends available to invite.');

        return result;
    }
    catch (error)
    {
        throw new Error(error.message || 'Failed to fetch friends list.');
    }
    finally
    {
        showLoadingSpinner(false);
    }
}

function renderFriendsList(friends, friendsList, tournamentId)
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
            inviteFriend(friendId, tournamentId);
        });
    });
}

async function inviteFriend(friendId, tournamentId)
{
    try
    {
        showLoadingSpinner(true);
        const response = await fetchWithAuth('/api/games/tournament/invite/', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                tournament_id: tournamentId,
                friend_id: friendId,
            }),
        });

        const result = await response.json();

        if (response.ok)
            showToast(result.message, 'success');
        else
            showToast(result.error, 'error');
    }
    catch (error)
    {
        showToast('An error occurred while sending the invitation.', 'error');
    }
    finally
    {
        showLoadingSpinner(false);
    }
}