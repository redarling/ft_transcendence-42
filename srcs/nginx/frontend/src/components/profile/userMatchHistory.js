export default function UserMatchHistoryComponent() {
    const userMatchHistorySection = document.querySelector('#userMatchHistory');
    userMatchHistorySection.innerHTML = `
            <h5 class="text-light">GAME HISTORY</h5>
            <table class="table table-hover game-history-table">
                <thead>
                <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Context</th>
                    <th scope="col">Result</th>
                    <th scope="col">Score</th>
                </tr>
                </thead>
                <tbody id="game-history-table-body">
                    <!-- Matches are added here -->
                </tbody>
            </table>

            <!-- Match summary modal -->
            <div class="modal" id="matchSummary" tabindex="-1" aria-labelledby="matchSummaryModal" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div class="col">
                                <h5>Game Summary</h5>
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <div class="modal-body">
                            <div class="row align-items-center">
                            
                                <div class="col text-start">
                                    <h2 id="modalMatchPlayerLeftName">PlayerLeft</h2>
                                </div>

                                <div class="col text-end">
                                    <h2 id="modalMatchLeftFinalScore">9</h2>
                                </div>

                                <div class="col-1 text-center">
                                    <h2>–</h2>
                                </div>

                                <div class="col text-start">
                                    <h2 id="modalMatchRightFinalScore">11</h2>
                                </div>

                                <div class="col text-end">
                                    <h2 id="modalMatchPlayerRightName">Player</h2>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col text-start">
                                    <h4>Ratio</h4>
                                    <h4>Times Hit</h4>
                                </div>
                                <div class="col text-end">
                                    <h4 id="modalMatchLeftRatio">x</h4>
                                    <h4 id="modalMatchLeftTimesHit">x</h4>
                                </div>
                                <div class="col-1 text-center">
                                    <div class="vr" style="height: 100%;"></div>
                                </div>
                                <div class="col text-start">
                                    <h4 id="modalMatchRightRatio">x</h4>
                                    <h4 id="modalMatchRightTimesHit">x</h4>
                                </div>
                                <div class="col text-end">
                                    <h4>Ratio</h4>
                                    <h4>Times Hit</h4>
                                </div>
                            </div>
                            <hr class="hr" />
                            <div class="row">
                                <div class="col text-center">
                                    <h6 id="modalMatchDuration">2:42</h6>
                                    <h6 id="modalMatchDate">Jan 09 - 11:28 PM</h6>
                                    <h6 id="modalMatchContext">Tournament</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    `;

    // Which player we are currently checking the game history from
    const userName = "Bob";

    function formatDate(date) {
        const options = { day: '2-digit', month: 'short' };
        const formattedDate = date.toLocaleDateString('us-US', options);
        const formattedTime = date.toLocaleTimeString('us-US', { hour: '2-digit', minute: '2-digit' });
        return `${formattedDate} - ${formattedTime}`;
    }

    function formatDuration(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs > 0 ? hrs + 'h ' : ''}${mins > 0 ? mins + 'm ' : ''}${secs}s`;
    }

    function addMatchToMatchHistoryTable(match) {
        const tr = document.createElement('tr');
        tr.setAttribute('id', match.id);
        tr.setAttribute('class', "matchHistoryRow");

        const td0 = document.createElement('td');
        td0.setAttribute('scope', 'row');
        td0.textContent = formatDate(match.date);

        tr.setAttribute('data-bs-toggle', 'modal');
        tr.setAttribute('data-bs-target', '#matchSummary');

        const td1 = document.createElement('td');
        td1.textContent = match.context;

        const td2 = document.createElement('td');

        if (match.winnerName === userName) {
            td2.textContent = "WIN";
            td2.setAttribute('style', 'color: #31D35A;');
        } else {
            td2.textContent = "LOSS";
            td2.setAttribute('style', 'color: #FF002C;');
        }

        const td3 = document.createElement('td');
        td3.textContent = match.leftPlayerData.score + "-" + match.rightPlayerData.score;

        tr.appendChild(td0);
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);

        const tbody = document.getElementById('game-history-table-body');
        tbody.appendChild(tr);
    }

    /* Game summary modal elements */
    const modalMatchPlayerLeftName = document.getElementById('modalMatchPlayerLeftName');
    const modalMatchLeftFinalScore = document.getElementById('modalMatchLeftFinalScore');
    const modalMatchLeftRatio = document.getElementById('modalMatchLeftRatio');
    const modalMatchLeftTimesHit = document.getElementById('modalMatchLeftTimesHit');
    const modalMatchRightRatio = document.getElementById('modalMatchRightRatio');
    const modalMatchRightTimesHit = document.getElementById('modalMatchRightTimesHit');
    const modalMatchDuration = document.getElementById('modalMatchDuration');
    const modalMatchDate = document.getElementById('modalMatchDate');
    const modalMatchContext = document.getElementById('modalMatchContext');
    const modalMatchPlayerRightName = document.getElementById('modalMatchPlayerRightName');
    const modalMatchRightFinalScore = document.getElementById('modalMatchRightFinalScore');
    /* -------------------------- */

    // !Placeholder data!
    // TODO: Fetch data from API + store in object + add to the matchHistory array
    let matchHistory = [];
    matchHistory.push({
        id: 0,
        date: new Date(Date.now()),
        winnerName: "Bob",
        context: "Tournament",
        duration: 120,

        leftPlayerData: {
            name: "Bob",
            score: 11,
            timesHit: 50,
            ratio: 5.0
        },

        rightPlayerData: {
            name: "Notbob",
            score: 5,
            timesHit: 32,
            ratio: 2.0
        }
    });

    matchHistory.push({
        id: 1,
        date: new Date(Date.now()),
        duration: 120,
        winnerName: "Notbob",
        context: "1v1",

        leftPlayerData: {
            name: "Bob",
            score: 9,
            timesHit: 49,
            ratio: 4.5
        },

        rightPlayerData: {
            name: "Notbob",
            score: 11,
            timesHit: 50,
            ratio: 5.0
        }
    });

    addMatchToMatchHistoryTable(matchHistory[0]);
    addMatchToMatchHistoryTable(matchHistory[1]);

    function fillGameSummaryModal(match) {
        modalMatchDate.innerHTML = formatDate(match.date);
        modalMatchContext.innerHTML = match.context;
        modalMatchDuration.innerHTML = formatDuration(match.duration);

        modalMatchPlayerLeftName.innerHTML = match.leftPlayerData.name;
        modalMatchLeftFinalScore.innerHTML = match.leftPlayerData.score;
        modalMatchLeftRatio.innerHTML = match.leftPlayerData.ratio;
        modalMatchLeftTimesHit.innerHTML = match.leftPlayerData.timesHit;

        modalMatchPlayerRightName.innerHTML = match.rightPlayerData.name;
        modalMatchRightFinalScore.innerHTML = match.rightPlayerData.score;
        modalMatchRightRatio.innerHTML = match.rightPlayerData.ratio;
        modalMatchRightTimesHit.innerHTML = match.rightPlayerData.timesHit;
    }

    // Listening on clicks on match history
    document.addEventListener('click', (event) => {

        // Check if the parent of the tr element we clicked is a row of the match history table
        const clickedRow = event.target.closest('tr[class="matchHistoryRow"]');
        if (clickedRow) {
            const matchId = clickedRow.id;
            fillGameSummaryModal(matchHistory[matchId]);
        }
    });
}