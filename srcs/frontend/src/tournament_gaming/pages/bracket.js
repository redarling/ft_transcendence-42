import { renderErrorPage, renderMatch } from '../../online_gaming/renderPages.js';

// bracket = {
//     "matches": [
//         {
//             "matchId": 1,
//             "player1": "user1", 
//             "player1alias" : "user1alias", 
//             "player1pp" : "./pp.jpg", 
//             "player2": "user2", 
//             "player2alias" : "user2alias", 
//             "player2pp" : "./pp.jpg", 
//             "status": "completed",
//             "winner": "player2",
//             "scorePlayer1": "9", 
//             "scorePlayer2": "11"
//         },

//         {
//             "matchId": 2,
//             "player1": "user3",
//             "player1alias" : "user3alias",
//             "player1pp" : "./pp.jpg",
//             "player2": "user4",
//             "player2alias" : "user4alias",
//             "player2pp" : "./pp.jpg",
//             "status": "pending",
//             "winner": "None",
//             "scorePlayer1": "0",
//             "scorePlayer2": "0"
//         },

//         {
//             "matchId": 3,
//             "player1": "user5",
//             "player1alias" : "user5alias",
//             "player1pp" : "./pp.jpg",
//             "player2": "user6",
//             "player2alias" : "user6alias",
//             "player2pp" : "./pp.jpg",
//             "status": "in_progress",
//             "winner": "None",
//             "scorePlayer1": "8",
//             "scorePlayer2": "4"
//         },

//         {
//             "matchId": 4,
//             "player1": "user7",
//             "player1alias" : "user7alias",
//             "player1pp" : "./pp.jpg",
//             "player2": "user8",
//             "player2alias" : "user8alias",
//             "player2pp" : "./pp.jpg",
//             "status": "completed",
//             "winner": "player1",
//             "scorePlayer1": "11",
//             "scorePlayer2": "2"
//         }

//     ]
// }

// // Placeholders
// const title = "Title";
// const description = "Description";
// const numberOfInitialMatches = 4; // Should be 4 8 16 32 64 128 ... handled by the backend

export default async function renderTournamentBracketPage(socket, token, tournamentId, title, description, bracket)
{
    let playerId = null;
    const numberOfParticipants = bracket.number_of_participants;

    const totalRounds = Math.log2(numberOfParticipants);
    console.log("Number of participants: ", numberOfParticipants);

    renderTournamentBracket(title, description, numberOfParticipants / 2, totalRounds);
    fillBracketInfos(bracket);

    socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        switch (data.event) {
            case "match_update":
                updateMatchCard(data.data);
                break;
            case "tournament_bracket":
                fillBracketInfos(data.data);
                break;
            case "tournament_end":
                showTournamentWinner(data.data.winner, numberOfParticipants);
                break;
            case "incoming_match":
                playerId = data.playerId;
                showReadyPopup(socket, data.match_id);
                break;
            case "match_start":
                console.log("Message received:", data);
                if (!playerId)
                {
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

function showReadyPopup(socket, matchId) {
    let readyUpButton = document.getElementById("readyUpButton");
    let readyUpModal = new bootstrap.Modal(document.getElementById('readyUpModal'));
    readyUpModal.show();
    readyUpButton.addEventListener("click", () => {
        socket.send(JSON.stringify({ event: "ready", matchId: matchId }));
        readyUpModal.hide();
    });
}

function showTournamentWinner(winner, numberOfParticipants) {
    const lastMatchCard = document.getElementById(`match-card${numberOfParticipants - 2}`);
    lastMatchCard.classList.add("final-win");
    setTimeout(() => {
        lastMatchCard.classList.add("winner-animation");
    }, 500);
}

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

function renderTournamentPageHeader(title, description) {
    const header = document.getElementById("header");
    header.innerHTML = `
      <div class="tournament-header">
        <div class="header-content">
          <h1>Tournament - ${title}</h1>
          <p>${description}</p>
        </div>
      </div>
    `;
}

let matchIndex = 0;
function createMatchCard() {
    const matchElement = document.createElement("div");
    matchElement.setAttribute("id", `match-card${matchIndex}`);
    matchElement.classList.add("match-card");

    matchElement.innerHTML = `
        <div class="row h-100">
            <div class="col d-flex flex-column justify-content-evenly">
                <div class="row d-flex align-items-center justify-content-between p-2 flex-nowrap">
                    <div class="d-flex align-items-center col-auto">
                        <img id="pp-player1-match${matchIndex}" src="/src/assets/images/placeholders/bye_avatar_placeholder.png" class="img-fluid profilePictureMatchInfo me-2">
                        <div id="alias-player1-match${matchIndex}" class="player" style="margin-right: 8px;">TBD</div>
                        <div id="nickname-player1-match${matchIndex}" class="player">(TBD)</div>
                    </div>
                    <div class="col-auto text-end">
                        <div id="score-player1-match${matchIndex}" class="score">0</div>
                    </div>
                </div>
                <hr class="hr text-grey" />
                <div class="row d-flex align-items-center justify-content-between p-2">
                    <div class="d-flex align-items-center col-auto">
                        <img id="pp-player2-match${matchIndex}" src="/src/assets/images/placeholders/bye_avatar_placeholder.png" class="img-fluid profilePictureMatchInfo me-2">
                        <div id="alias-player2-match${matchIndex}" class="player" style="margin-right: 8px;">TBD</div>
                        <div id="nickname-player2-match${matchIndex}" class="player">(TBD)</div>
                    </div>
                    <div class="col-auto text-end">
                        <div id="score-player2-match${matchIndex}" class="score">0</div>
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
    matchIndex++;
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
    let matchIndex = -1;
    for (let i = 0; i < bracket.matches.length; ++i) {
        if (bracket.matches[i]["match_id"] === matchInfos["match_id"]) {
            matchIndex = i;
            break;
        }
    }
    if (matchIndex === -1) {
        console.error("Failed to retreive the match index based on the match id.");
        return;
    }

    const matchCard = document.getElementById(`match-card${matchIndex}`);
    if (matchInfos["status"] === "in_progress") {
        matchCard.classList.add("in-progress");
    } else if (matchInfos["status"] === "completed") {
        matchCard.classList.add("completed");

        const matchCardPlayer1Alias = document.getElementById(`alias-player1-match${i}`);
        const matchCardPlayer2Alias = document.getElementById(`alias-player2-match${i}`);

        const winner_id = bracket.matches[i]["winner"];
        const player1_id = bracket.matches[i]["player1_id"];
        const player2_id = bracket.matches[i]["player2_id"];

        if (winner_id === player1_id) {
            matchCardPlayer1Alias.classList.add("winner");
            matchCardPlayer2Alias.classList.add("loser");
        } else if (winner_id === player2_id) {
            matchCardPlayer2Alias.classList.add("winner");
            matchCardPlayer1Alias.classList.add("loser");
        }
    }

}

function fillBracketInfos(bracket) {
    for (let i = 0; i < bracket.matches.length; ++i) {

        const matchCardPlayer1pp = document.getElementById(`pp-player1-match${i}`);
        const matchCardPlayer1Nickname = document.getElementById(`nickname-player1-match${i}`);
        const matchCardPlayer1Alias = document.getElementById(`alias-player1-match${i}`);
        const matchCardPlayer1Score = document.getElementById(`score-player1-match${i}`);
        const matchCardPlayer2pp = document.getElementById(`pp-player2-match${i}`);
        const matchCardPlayer2Nickname = document.getElementById(`nickname-player2-match${i}`);
        const matchCardPlayer2Alias = document.getElementById(`alias-player2-match${i}`);
        const matchCardPlayer2Score = document.getElementById(`score-player2-match${i}`);

        const matchCard = document.getElementById(`match-card${i}`);
        if (bracket.matches[i]["status"] === "in_progress") {
            matchCard.classList.add("in-progress");
        } else if (bracket.matches[i]["status"] === "completed") {
            matchCard.classList.add("completed");
            const matchCardPlayer1Alias = document.getElementById(`alias-player1-match${i}`);
            const matchCardPlayer2Alias = document.getElementById(`alias-player2-match${i}`);

            const winner_id = bracket.matches[i]["winner"];
            const player1_id = bracket.matches[i]["player1_id"];
            const player2_id = bracket.matches[i]["player2_id"];

            if (winner_id === player1_id) {
                matchCardPlayer1Alias.classList.add("winner");
                matchCardPlayer2Alias.classList.add("loser");
            } else if (winner_id === player2_id) {
                matchCardPlayer2Alias.classList.add("winner");
                matchCardPlayer1Alias.classList.add("loser");
            }
        }

        matchCardPlayer1pp.setAttribute("src", (bracket.matches[i]["player1_avatar"] ? bracket.matches[i]["player1_avatar"] : "/src/assets/images/placeholders/bye_avatar_placeholder.png"));
        matchCardPlayer1Nickname.innerHTML = "(" + bracket.matches[i]["player1_username"] + ")";
        matchCardPlayer1Alias.innerHTML = bracket.matches[i]["player1_alias"];
        matchCardPlayer1Score.innerHTML = bracket.matches[i]["score_player1"];
        matchCardPlayer2pp.setAttribute("src", (bracket.matches[i]["player2_avatar"] ? bracket.matches[i]["player2_avatar"] : "/src/assets/images/placeholders/bye_avatar_placeholder.png"));
        matchCardPlayer2Nickname.innerHTML = "(" + bracket.matches[i]["player2_username"] + ")";
        matchCardPlayer2Alias.innerHTML = bracket.matches[i]["player2_alias"];
        matchCardPlayer2Score.innerHTML = bracket.matches[i]["score_player2"];
    }
}
