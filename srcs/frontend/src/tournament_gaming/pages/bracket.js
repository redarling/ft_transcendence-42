import { renderErrorPage, renderMatch } from '../../online_gaming/renderPages.js';
import readyUpToast from '../../utils/readyupToast.js'

export default async function renderTournamentBracketPage(socket, token, tournamentId, title, description, data)
{
    let playerId = null;

    const numberOfParticipants = data["total_participants_including_bye"];
    const totalRounds = Math.log2(numberOfParticipants);

    renderTournamentBracket(title, description, numberOfParticipants / 2, totalRounds);
    fillBracketInfos(data["bracket"]);

    socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        switch (data.event) {
            case "match_update":
                updateMatchCard(data.data);
                break;
            case "tournament_bracket":
                fillBracketInfos(data.data["bracket"]);
                break;
            case "tournament_end":
                showTournamentWinner(numberOfParticipants);
                break;
            case "incoming_match":
                playerId = data.playerId;
                showReadyupToast(socket, data.match_id);
                break;
            case "match_start":
                console.log("Message received:", data);
                if (!playerId) {
                    renderErrorPage("Failed to start the match. Please try again.");
                    return;
                }
                const player1Username = data.match_data.player1_username;
                const player2Username = data.match_data.player2_username;
                const player1Avatar = data.match_data.player1_avatar;
                const player2Avatar = data.match_data.player2_avatar;
                renderMatch(socket, playerId, player1Username, player2Username, player1Avatar, player2Avatar, true);
                break;
            default:
                break;
      }
    });
}

// Ready pop up when a match is ready to be played
function showReadyupToast(socket, matchId) {
    readyUpToast();
    const readyUpToastEl = document.getElementById("readyup-toast");
    const readyUpButton = document.getElementById("readyup-btn");
    const readyUpToastObj = new bootstrap.Toast(readyUpToastEl, {
        autohide: true,
        delay: 30000 // 30 seconds
    });
    readyUpToastObj.show();
    readyUpButton.addEventListener("click", () => {
        socket.send(JSON.stringify({ event: "ready", matchId: matchId }));
        readyUpToastObj.hide();
    });
}

// Annimation showing the winner of the tournament
function showTournamentWinner(numberOfParticipants) {
    const lastMatchCard = document.getElementById(`match-card${numberOfParticipants - 2}`);
    if (lastMatchCard) {
        lastMatchCard.classList.add("final-win");
        setTimeout(() => {
            lastMatchCard.classList.add("winner-animation");
        }, 500);
    }
}

// Round infos at the top the bracket
function createRoundHeader(roundIndex, numberOfMatches) {
    const matchHeader = document.createElement("div");
    matchHeader.classList.add("col-auto");

    matchHeader.innerHTML = `
        <div class="match-card-header">
        <h3>Round ${roundIndex}</h3>
        <p>${numberOfMatches} matches</p>
        <hr class="hr text-grey" />
        </div>
    `;

    return matchHeader;
}

// Page header (title + description) at the top of the page
function renderTournamentPageHeader(title, description) {
    const header = document.getElementById("header");
    if (header) {
        header.innerHTML = `
        <div class="tournament-header">
          <div class="header-content">
            <h1>Tournament - ${title}</h1>
            <p>${description}</p>
          </div>
        </div>
      `;
    }
}

// Create all matches card creating the bracket
let matchCardIndex = 0;
function createMatchCard() {
    const matchElement = document.createElement("div");
    matchElement.setAttribute("id", `match-card${matchCardIndex}`);
    matchElement.classList.add("match-card");

    matchElement.innerHTML = `
        <div class="row h-100">
            <div class="col d-flex flex-column justify-content-evenly">
                <div class="row d-flex align-items-center justify-content-between p-2 flex-nowrap">
                    <div class="d-flex align-items-center col-auto">
                        <img id="pp-player1-match${matchCardIndex}" src="/src/assets/images/placeholders/bye_avatar_placeholder.png" class="img-fluid profilePictureMatchInfo me-2">
                        <div id="alias-player1-match${matchCardIndex}" class="player" style="margin-right: 8px;">TBD</div>
                        <div id="nickname-player1-match${matchCardIndex}" class="player">(TBD)</div>
                    </div>
                    <div class="col-auto text-end">
                        <div id="score-player1-match${matchCardIndex}" class="score">0</div>
                    </div>
                </div>
                <hr class="hr text-grey" />
                <div class="row d-flex align-items-center justify-content-between p-2">
                    <div class="d-flex align-items-center col-auto">
                        <img id="pp-player2-match${matchCardIndex}" src="/src/assets/images/placeholders/bye_avatar_placeholder.png" class="img-fluid profilePictureMatchInfo me-2">
                        <div id="alias-player2-match${matchCardIndex}" class="player" style="margin-right: 8px;">TBD</div>
                        <div id="nickname-player2-match${matchCardIndex}" class="player">(TBD)</div>
                    </div>
                    <div class="col-auto text-end">
                        <div id="score-player2-match${matchCardIndex}" class="score">0</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal fade" data-bs-backdrop="static" id="readyUpModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header d-flex flex-column justify-content-center">
                <h1 class="modal-title text-center">Your match is ready !</h1>
                <p>The match will begin automatically once both players are ready</p>
              </div>
              <div class="modal-body">
                <button id="readyUpButton" type="button" class="btn btn-success">Ready</button>
              </div>
            </div>
          </div>
        </div>
    `;
    matchCardIndex++;
    return matchElement;
}

function createRoundMatchesCards(numberOfMatchesByRound) {
    const roundMatches = document.createElement("div");
    roundMatches.classList.add("col-auto", "d-flex", "flex-column", "justify-content-around");

    for (let i = 0; i < numberOfMatchesByRound; ++i) {
        let matchCard = createMatchCard(); // change matchid
        roundMatches.appendChild(matchCard);
    }

    return roundMatches;
}

function renderRoundColumns(numberOfInitialMatches, totalRounds) {
    const bracketDiv = document.getElementById("bracket");
    let numberOfMatchesByRound = numberOfInitialMatches;

    const headersRow = document.createElement("div");
    headersRow.classList.add("row", "d-flex", "flex-nowrap");

    const matchesRow = document.createElement("div");
    matchesRow.classList.add("row", "d-flex", "flex-nowrap");

    matchCardIndex = 0;
    
    for (let i = 0; i < totalRounds; ++i) {

        const roundHeader = createRoundHeader(i + 1, numberOfMatchesByRound);
        headersRow.appendChild(roundHeader);

        const matchesCards = createRoundMatchesCards(numberOfMatchesByRound);
        matchesRow.appendChild(matchesCards);

        numberOfMatchesByRound = numberOfMatchesByRound / 2;
    }

    bracketDiv.appendChild(headersRow);
    bracketDiv.appendChild(matchesRow);
}

function renderTournamentBracket(title, description, numberOfInitialMatches, totalRounds) {
    const main = document.getElementById("main");

    main.innerHTML = `
        <div class="container-fluid mt-4">
            <div id="bracket" class="row"></div>
        </div>
    `;

    renderTournamentPageHeader(title, description);
    renderRoundColumns(numberOfInitialMatches, totalRounds);
}

function updateMatchCard(matchInfos) {
    const bracketIdx = matchInfos["bracket_index"];

    const matchCardPlayer1pp = document.getElementById(`pp-player1-match${bracketIdx}`);
    const matchCardPlayer1Alias = document.getElementById(`alias-player1-match${bracketIdx}`);
    const matchCardPlayer1Nickname = document.getElementById(`nickname-player1-match${bracketIdx}`);
    const matchCardPlayer1Score = document.getElementById(`score-player1-match${bracketIdx}`);

    const matchCardPlayer2pp = document.getElementById(`pp-player2-match${bracketIdx}`);
    const matchCardPlayer2Alias = document.getElementById(`alias-player2-match${bracketIdx}`);
    const matchCardPlayer2Nickname = document.getElementById(`nickname-player2-match${bracketIdx}`);
    const matchCardPlayer2Score = document.getElementById(`score-player2-match${bracketIdx}`);

    const matchCard = document.getElementById(`match-card${bracketIdx}`);

    if (matchCardPlayer1pp &&
        matchCardPlayer1Alias &&
        matchCardPlayer1Nickname &&
        matchCardPlayer1Score &&
        matchCardPlayer2pp &&
        matchCardPlayer2Alias &&
        matchCardPlayer2Nickname && 
        matchCardPlayer2Score &&
        matchCard)
    {
        // Fill basic card infos
        matchCardPlayer1pp.setAttribute("src", (matchInfos["player1_avatar"] ? matchInfos["player1_avatar"] : "/src/assets/images/placeholders/bye_avatar_placeholder.png"));
        matchCardPlayer1Alias.innerHTML = matchInfos["player1_alias"];
        matchCardPlayer1Nickname.innerHTML = "(" + matchInfos["player1_username"] + ")";
        matchCardPlayer1Score.innerHTML = matchInfos["score_player1"];

        matchCardPlayer2pp.setAttribute("src", (matchInfos["player2_avatar"] ? matchInfos["player2_avatar"] : "/src/assets/images/placeholders/bye_avatar_placeholder.png"));
        matchCardPlayer2Alias.innerHTML = matchInfos["player2_alias"];
        matchCardPlayer2Nickname.innerHTML = "(" + matchInfos["player2_username"] + ")";
        matchCardPlayer2Score.innerHTML = matchInfos["score_player2"];

        // Customize style depending on status
        if (matchInfos["status"] === "in_progress") {
            matchCard.classList.add("in-progress");
        } else if (matchInfos["status"] === "completed") {
            matchCard.classList.add("completed");
        
            const winnerId = matchInfos["winner"];
            const player1Id = matchInfos["player1_id"];
            const player2Id = matchInfos["player2_id"];
        
            if (winnerId) {
                if (winnerId === player1Id) {
                    matchCardPlayer1Alias.classList.add("winner");
                    matchCardPlayer2Alias.classList.add("loser");
                } else if (winnerId === player2Id) {
                    matchCardPlayer2Alias.classList.add("winner");
                    matchCardPlayer1Alias.classList.add("loser");
                }
            }
        }
    }

    
}

function fillBracketInfos(bracket) {
    for (let roundIdx = 0; roundIdx < bracket.length; ++roundIdx) {
        let matches = bracket[roundIdx]["matches"];
        for (let matchIdx = 0; matchIdx < matches.length; ++matchIdx) {
            updateMatchCard(matches[matchIdx]);
        }
    }
}
