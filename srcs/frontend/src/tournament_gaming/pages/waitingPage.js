import inviteButton from "../waiting_buttons/invite_button.js";
import leaveButton from "../waiting_buttons/leave_button.js";
import cancelButton from "../waiting_buttons/cancel_button.js";
import startButton from "../waiting_buttons/start_button.js";

export default async function renderTournamentWaitingPage(socket, token, participants, title, description, isAdmin, tournamentId)
{
    const main = document.getElementById("main");
    document.getElementById('header').innerHTML= '';
    
    main.innerHTML = `
        <div class="container-fluid tournament-container" style="min-height: calc(100vh - 100px); padding-top: 30px;">
            <div class="row w-100 align-items-center d-flex justify-content-evenly">
                <div class="col-md-8 text-center">
                    <div class="card game-card mb-4">
                        <div class="card-body">
                            <h3 class="card-title mb-4" style="color: red;">${title}</h3>
                            <p style="color: #aaa;">${description}</p>

                            <div id="participantsList" class="mt-4">
                            </div>

                            <div class="buttons mt-4">
                                <button class="btn btn-secondary" id="inviteBtn">Invite</button>
                                ${
                                    !isAdmin 
                                    ? `
                                        <button class="btn btn-danger" id="leaveBtn">Leave</button>
                                    `
                                    : ''
                                }
                                ${
                                    isAdmin 
                                    ? `
                                        <button class="btn btn-warning" id="cancelBtn">Cancel</button>
                                        <button class="btn btn-success" id="startBtn">Start</button>
                                    `
                                    : ''
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById("inviteBtn").addEventListener("click", () => inviteButton(token, tournamentId));

    if (!isAdmin)
        document.getElementById("leaveBtn").addEventListener("click", () => leaveButton(socket, token, tournamentId));
    else
    {
        document.getElementById("cancelBtn").addEventListener("click", () => cancelButton(socket, token, tournamentId));
        document.getElementById("startBtn").addEventListener("click", () => startButton(socket, token, tournamentId));
    }

    renderParticipantsList(participants);
}

function renderParticipantsList(participants)
{
    const participantsList = document.getElementById('participantsList');
    participantsList.innerHTML = '';

    if (participants.length === 0)
    {
        participantsList.innerHTML = '<p>No participants yet.</p>';
        return;
    }

    participants.forEach((participant) => {
        const participantElement = document.createElement('div');
        participantElement.className = 'participant-item d-flex align-items-center mb-2';
        participantElement.innerHTML = `
            <img src="${participant.avatar}" alt="${participant.username}" class="avatar" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
            <span class="username" style="color: white;">${participant.alias} (${participant.username})</span>
        `;
        participantsList.appendChild(participantElement);
    });
}