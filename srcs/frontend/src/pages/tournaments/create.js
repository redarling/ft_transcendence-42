import { joinTournament } from './join.js';
import { tournamentHandler } from '../../tournament_gaming/tournamentHandler.js';
import showLoadingSpinner from '../../utils/spinner.js';
import showToast from '../../utils/toast.js';

export default async function createTournamentModal(token)
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
                    <div class="mb-3">
                        <label for="tournamentAlias" class="form-label">Alias (Your special tournament nick)</label>
                        <input type="text" class="form-control" id="tournamentAlias" maxlength="16" placeholder="Enter your tournament alias">
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
    const aliasInput = document.getElementById("tournamentAlias");
    const createBtn = document.getElementById("createTournamentModalBtn");

    function validateForm()
    {
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const alias = aliasInput.value.trim();
        createBtn.disabled = !(title.length > 0 && description.length > 0 && alias.length > 0);
    }

    titleInput.addEventListener("input", validateForm);
    descriptionInput.addEventListener("input", validateForm);
    aliasInput.addEventListener("input", validateForm);

    document.getElementById("closeModalBtn").addEventListener("click", () => {
        modal.remove();
    });

    createBtn.addEventListener("click", async () => {
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const alias = aliasInput.value.trim();

        try
        {
            const createResult = await createTournament(token, title, description);
            if (!createResult.success)
                throw new Error(createResult.message);

            const tournamentId = createResult.tournamentId;
            const joinResult = await joinTournament(token, tournamentId, alias);

            if (!joinResult.success)
                throw new Error(joinResult.message);

            const webSocketUrl = joinResult.webSocketUrl;
            document.querySelectorAll('.modal-overlay').forEach((modal) => modal.remove());
            await tournamentHandler(webSocketUrl, token, tournamentId);
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

async function createTournament(token, title, description)
{
    try
    {
        showLoadingSpinner(true);
        const response = await fetch('/api/games/tournament/create/', {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title, description }),
        });

        const result = await response.json();
        if (!response.ok)
            throw new Error(result.detail || result.error || "Failed to create tournament");

        return { success: true, tournamentId: result.id, message: "Tournament successfully created!" };
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
