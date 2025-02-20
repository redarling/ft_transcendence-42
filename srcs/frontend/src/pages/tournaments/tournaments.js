import renderFooter from '../../components/footer.js';
import renderHeader from '../../components/header.js';
import createTournamentModal from './create.js';
import searchTournament from './search.js';
import invitationsList from './invitations.js';
import { checkActiveTournament } from '../../online_gaming/recoverySystem.js'
import showToast from '../../utils/toast.js';
import { tournamentHandler } from "../../tournament_gaming/tournamentHandler.js";

export default async function renderTournaments()
{
    try
    {
        const tournament = await checkActiveTournament(localStorage.getItem('access_token'));
        if (tournament && tournament.active)
        {
            const tournamentWebSocketLink = `wss://transcendence-pong:7443/ws/tournament/${tournament.tournament_id}/`;
            await tournamentHandler(tournamentWebSocketLink, token, tournament.tournament_id);
        }
    }
    catch (error)
    {
        showToast(error, "error");
    }

    const tournamentToastEl = document.getElementById('tournament-ongoing-toast');
    
    if (tournamentToastEl)
    {
        const tournamentToast = new bootstrap.Toast(tournamentToastEl);
        tournamentToast.hide();
    }

    const main = document.getElementById("main");

    main.innerHTML = `
        <div class="container-fluid game-mode-container">
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

    document.getElementById("createTournamentBtn").addEventListener("click", () => createTournamentModal());
    document.getElementById("searchTournamentBtn").addEventListener("click", () => searchTournament());
    document.getElementById("myInvitationsBtn").addEventListener("click", () => invitationsList());
}