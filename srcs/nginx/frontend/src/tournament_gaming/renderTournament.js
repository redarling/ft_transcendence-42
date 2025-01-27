export default async function renderTournamentWaitingPage(participants, title, description, isAdmin)
{
    const main = document.getElementById("main");
    document.getElementById('header').innerHTML= '';

    console.log(participants, title, description, isAdmin);
    
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
                                <button class="btn btn-danger" id="leaveBtn">Leave</button>
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

    document.getElementById("inviteBtn").addEventListener("click", () => alert('Invite clicked'));
    document.getElementById("leaveBtn").addEventListener("click", () => alert('Leave clicked'));

    if (isAdmin)
    {
        document.getElementById("cancelBtn").addEventListener("click", () => alert('Cancel tournament clicked'));
        document.getElementById("startBtn").addEventListener("click", () => alert('Start tournament clicked'));
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
            <span class="username" style="color: white;">${participant.username} (${participant.alias})</span>
        `;
        participantsList.appendChild(participantElement);
    });
}
