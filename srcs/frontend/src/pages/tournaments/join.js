import { tournamentHandler } from "../../tournament_gaming/tournamentHandler.js";

export async function joinTournament(token, tournamentId, tournamentAlias)
{
    const url = "https://transcendence-pong:7443/api/games/tournament/join/";
    try
    {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ tournament_id: tournamentId, tournament_alias: tournamentAlias }),
        });

        if (!response.ok)
        {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to join the tournament");
        }

        const responseData = await response.json();
        return { success: true, webSocketUrl: responseData.webSocketUrl };
    }
    catch (error)
    {
        return { success: false, message: error.message };
    }
}

export async function joinTournamentModal(token, tournamentId)
{
    const modal = createJoinAliasModal();
    document.body.appendChild(modal);

    const closeModalBtn = document.getElementById('closeJoinModalBtn');
    const joinBtn = document.getElementById('joinTournamentBtn');
    const aliasInput = document.getElementById('tournamentAlias');

    closeModalBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    aliasInput.addEventListener('input', () => {
        joinBtn.disabled = !aliasInput.value.trim();
    });

    joinBtn.addEventListener('click', async () => {
        const alias = aliasInput.value.trim();
        if (!alias)
        {
            alert('Please enter a tournament alias.');
            return;
        }

        try
        {
            const joinResult = await joinTournament(token, tournamentId, alias);
            if (!joinResult.success)
                throw new Error(joinResult.message);

            const webSocketUrl = joinResult.webSocketUrl;
            document.querySelectorAll('.modal-overlay').forEach((modal) => modal.remove());
            await tournamentHandler(webSocketUrl, token, tournamentId);
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

function createJoinAliasModal()
{
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header d-flex justify-content-between align-items-center">
                <h5 class="modal-title">Join Tournament</h5>
                <button type="button" class="btn-close" id="closeJoinModalBtn" aria-label="Close">×</button>
            </div>
            <div class="modal-body">
                <form id="joinTournamentForm">
                    <div class="mb-3">
                        <label for="tournamentAlias" class="form-label">Alias (Your special tournament nick)</label>
                        <input type="text" class="form-control" id="tournamentAlias" maxlength="16" placeholder="Enter your tournament alias">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" id="joinTournamentBtn" disabled>Join</button>
            </div>
        </div>
    `;
    return modal;
}