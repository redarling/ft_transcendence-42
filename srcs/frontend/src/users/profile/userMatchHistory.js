export default function UserMatchHistoryComponent(userName, matches, matchesStats) {
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

            <div class="modal" id="matchSummary" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content w-100">
                        <div class="modal-header">
                            <div class="col">
                                <h5>Game Summary</h5>
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div class="modal-body">
                            <div class="row align-items-center">
                            
                                <div class="col text-start">
                                    <h2 id="modalMatchPlayerLeftName"></h2>
                                </div>

                                <div class="col text-end">
                                    <h2 id="modalMatchLeftFinalScore"></h2>
                                </div>

                                <div class="col-1 text-center">
                                    <h2>–</h2>
                                </div>

                                <div class="col text-start">
                                    <h2 id="modalMatchRightFinalScore"></h2>
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
                                    <h4 id="modalMatchLeftRatio"></h4>
                                    <h4 id="modalMatchLeftTimesHit"></h4>
                                </div>
                                <div class="col-1 text-center">
                                    <div class="vr" style="height: 100%;"></div>
                                </div>
                                <div class="col text-start">
                                    <h4 id="modalMatchRightRatio"></h4>
                                    <h4 id="modalMatchRightTimesHit"></h4>
                                </div>
                                <div class="col text-end">
                                    <h4>Ratio</h4>
                                    <h4>Times Hit</h4>
                                </div>
                            </div>
                            <hr class="hr" />
                            <div class="row">
                                <div class="col text-center">
                                    <h6 id="modalMatchDuration"></h6>
                                    <h6 id="modalMatchDate"></h6>
                                    <h6 id="modalMatchContext"></h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    `;

    function formatDate(date) {
        const options = { day: '2-digit', month: 'short' };
        const formattedDate = date.toLocaleDateString('us-US', options);
        const formattedTime = date.toLocaleTimeString('us-US', { hour: '2-digit', minute: '2-digit' });
        return `${formattedDate} - ${formattedTime}`;
    }

    function formatDuration(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs}h ${mins}m ${secs}s`;
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

    // Left player is always the player of the profile we're on
    let matchHistory = [];
    for (let i = 0; i < matches.length; ++i) {

        const date = new Date(matches[i].match.finished_at);
        const winnerName = matches[i].match.winner_username;
        const context = matches[i].match.match_type;

        const startedAt = new Date(matches[i].match.started_at);
        const endedAt = new Date(matches[i].match.finished_at);
        const duration = Math.abs((endedAt - startedAt) / 1000);

        const leftPlayerStats = matchesStats[i][0].player_username === userName ? matchesStats[i][0] : matchesStats[i][1];
        const rightPlayerStats = matchesStats[i][0].player_username !== userName ? matchesStats[i][0] : matchesStats[i][1];

        matchHistory.push({
            id: i,
            date: date,
            winnerName: winnerName,
            context: context, // 1v1 or tournament
            duration: duration, // in seconds
    
            leftPlayerData: {
                name: leftPlayerStats.player_username,
                score: leftPlayerStats.points_scored,
                timesHit: leftPlayerStats.total_hits,
                ratio: rightPlayerStats.points_scored > 0 ? (rightPlayerStats.points_scored / leftPlayerStats.points_scored).toFixed(2) : 0
            },
    
            rightPlayerData: {
                name: rightPlayerStats.player_username,
                score: rightPlayerStats.points_scored,
                timesHit: rightPlayerStats.total_hits,
                ratio: leftPlayerStats.points_scored > 0 ? (leftPlayerStats.points_scored / rightPlayerStats.points_scored).toFixed(2) : 0
            }
        });

        addMatchToMatchHistoryTable(matchHistory[i]);
    }

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