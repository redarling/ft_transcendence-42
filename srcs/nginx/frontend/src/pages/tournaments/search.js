export default async function searchTournament(token)
{
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
        if (!title)
            return;

        try
        {
            const tournaments = await fetchTournaments(token, title);
            renderSearchResults(tournaments, searchResults);
        }
        catch (error)
        {
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