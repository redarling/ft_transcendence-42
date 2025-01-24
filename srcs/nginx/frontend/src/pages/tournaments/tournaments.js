import renderFooter from '../../components/footer.js';
import renderHeader from '../../components/header.js';

let tournamentToken = null;

async function promptForToken()
{
    while (!tournamentToken)
    {
        tournamentToken = prompt("JWT token for tournament access (not possible to leave empty):");
    }
    return tournamentToken;
}

export default async function renderTournaments()
{
    await promptForToken();

    const main = document.getElementById("main");

    main.innerHTML = `
        <div class="container-fluid game-mode-container" style="min-height: calc(100vh - 100px); padding-top: 30px;">
            <div class="row w-100 align-items-center d-flex justify-content-evenly">

                <!-- Create Tournament -->
                <div class="col-md-4 text-center">
                    <div class="card game-card mb-4">
                        <div class="card-body">
                            <h3 class="card-title mb-4">Create Tournament</h3>
                            <button type="button" class="btn btn-primary btn-lg btn-game-mode" id="createTournamentBtn">
                                Create
                            </button>
                            <p class="text-muted mt-3">Create your own tournament</p>
                        </div>
                    </div>
                </div>

                <!-- Search Tournament -->
                <div class="col-md-4 text-center">
                    <div class="card game-card mb-4">
                        <div class="card-body">
                            <h3 class="card-title mb-4">Search Tournament</h3>
                            <button type="button" class="btn btn-success btn-lg btn-game-mode" id="searchTournamentBtn">
                                Search
                            </button>
                            <p class="text-muted mt-3">Search for an existing tournament</p>
                        </div>
                    </div>
                </div>

                <!-- Invitations -->
                <div class="col-md-4 text-center">
                    <div class="card game-card mb-4">
                        <div class="card-body">
                            <h3 class="card-title mb-4">Invitations List</h3>
                            <button type="button" class="btn btn-warning btn-lg btn-game-mode" id="myInvitationsBtn">
                                Check
                            </button>
                            <p class="text-muted mt-3">Check tournament invitations</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;

    renderFooter();
    renderHeader();

    document.getElementById("createTournamentBtn").addEventListener("click", () => createTournamentModal(tournamentToken));
    document.getElementById("searchTournamentBtn").addEventListener("click", () => searchTournament(tournamentToken));
    document.getElementById("myInvitationsBtn").addEventListener("click", () => invitationsList(tournamentToken));
}

async function createTournamentModal(token)
{
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header d-flex justify-content-between align-items-center">
                <h5 class="modal-title">Create Tournament</h5>
                <button type="button" class="btn-close" id="closeModalBtn" aria-label="Close">×</button>
            </div>
            <div class="modal-body">
                <form id="createTournamentForm">
                    <div class="mb-3">
                        <label for="tournamentTitle" class="form-label">Title</label>
                        <input type="text" class="form-control" id="tournamentTitle" maxlength="24" placeholder="Enter tournament title">
                    </div>
                    <div class="mb-3">
                        <label for="tournamentDescription" class="form-label">Description</label>
                        <textarea class="form-control" id="tournamentDescription" maxlength="64" rows="3" placeholder="Enter tournament description"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" id="createTournamentModalBtn" disabled>Create</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const titleInput = document.getElementById("tournamentTitle");
    const descriptionInput = document.getElementById("tournamentDescription");
    const createBtn = document.getElementById("createTournamentModalBtn");

    function validateForm() {
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        createBtn.disabled = !(title.length > 0 && description.length > 0);
    }

    titleInput.addEventListener("input", validateForm);
    descriptionInput.addEventListener("input", validateForm);

    document.getElementById("closeModalBtn").addEventListener("click", () => {
        modal.remove();
    });

    createBtn.addEventListener("click", async () => {
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        try
        {
            const result = await createTournament(tournamentToken, title, description);
            alert(result.message);
        }
        catch (error)
        {
            alert(`Error: ${error.message}`);
        }
        finally
        {
            modal.remove();
        }
    });
}

async function createTournament(token, title, description)
{
    const url = "https://transcendence-pong:7443/api/games/tournament/create/";
    try
    {
        const response = await fetch(url,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, description }),
        });

        if (!response.ok)
        {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to create tournament");
        }

        const responseData = await response.json();
        return { success: true, message: "Tournament successfully created!" };
    }
    catch (error)
    {
        return { success: false, message: error.message };
    }
}

async function searchTournament(token) {
    const modal = createSearchModal();
    document.body.appendChild(modal);

    const closeModalBtn = document.getElementById('closeModalBtn');
    const searchTournamentModalBtn = document.getElementById('searchTournamentModalBtn');
    const tournamentTitleInput = document.getElementById('tournamentTitle');
    const searchResults = document.getElementById('searchResults');

    closeModalBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    tournamentTitleInput.addEventListener('input', () => {
        searchTournamentModalBtn.disabled = !tournamentTitleInput.value.trim();
    });

    searchTournamentModalBtn.addEventListener('click', async () => {
        const title = tournamentTitleInput.value.trim();
        if (!title) return;

        try {
            const tournaments = await fetchTournaments(token, title);
            renderSearchResults(tournaments, searchResults);
        } catch (error) {
            searchResults.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    });
}

function createSearchModal()
{
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header d-flex justify-content-between align-items-center">
                <h5 class="modal-title">Search Tournament</h5>
                <button type="button" class="btn-close" id="closeModalBtn" aria-label="Close">×</button>
            </div>
            <div class="modal-body">
                <form id="searchTournamentForm">
                    <div class="mb-3">
                        <label for="tournamentTitle" class="form-label">Title</label>
                        <input type="text" class="form-control" id="tournamentTitle" maxlength="24" placeholder="Enter tournament title">
                    </div>
                </form>
                <div id="searchResults" class="search-results"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" id="searchTournamentModalBtn" disabled>Search</button>
            </div>
        </div>
    `;
    return modal;
}

async function fetchTournaments(token, title)
{
    const url = `https://transcendence-pong:7443/api/games/tournament/search/?title=${encodeURIComponent(title)}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok)
        throw new Error(response.statusText);

    return await response.json();
}

function renderSearchResults(tournaments, searchResults)
{
    searchResults.innerHTML = '';

    if (tournaments.length === 0)
    {
        searchResults.innerHTML = '<p>No tournaments found matching the title.</p>';
        return;
    }

    tournaments.forEach((tournament) => {
        const tournamentElement = document.createElement('div');
        tournamentElement.className = 'tournament-item';
        tournamentElement.innerHTML = `
            <h5>${tournament.title}</h5>
            <p>${tournament.description}</p>
            <button class="btn btn-secondary join-tournament-btn" data-id="${tournament.id}">Join</button>
        `;
        searchResults.appendChild(tournamentElement);
    });

    document.querySelectorAll('.join-tournament-btn').forEach((button) => {
        button.addEventListener('click', () => {
            alert('Join functionality is not implemented yet.');
        });
    });
}

async function invitationsList(token)
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
