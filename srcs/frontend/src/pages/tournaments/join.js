import { tournamentHandler } from "../../tournament_gaming/tournamentHandler.js";
import showLoadingSpinner from '../../utils/spinner.js';
import showToast from '../../utils/toast.js';

export async function joinTournament(tournamentId, tournamentAlias)
{
    try
    {
        const token = localStorage.getItem('access_token');
        if (!token)
        {
            throw new Error('Unauthorized.');
        }

        showLoadingSpinner(true);
        const response = await fetch('/api/games/tournament/join/', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ tournament_id: tournamentId, tournament_alias: tournamentAlias }),
        });

        const result = await response.json();
        if (!response.ok)
        {
            const errorMsg = result.error || result.detail || 'Failed to join tournament.';
            throw new Error(errorMsg);
        }
        return { success: true, webSocketUrl: result.webSocketUrl };
    }
    catch (error)
    {
        return { success: false, message: error.message };
    }
    finally
    {
        showLoadingSpinner(false);
    }
}

export async function joinTournamentModal(tournamentId)
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
            showToast("Please enter your tournament alias", "info");
            return;
        }

        try
        {
            const joinResult = await joinTournament(tournamentId, alias);
            if (!joinResult.success)
                throw new Error(joinResult.message);

            const webSocketUrl = joinResult.webSocketUrl;
            document.querySelectorAll('.modal-overlay').forEach((modal) => modal.remove());
            await tournamentHandler(webSocketUrl, tournamentId);
        }
        catch (error)
        {
            showToast(error.message, "error");
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