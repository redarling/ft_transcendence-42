import { renderErrorPage, renderMatch } from '../../online_gaming/renderPages.js';

export default async function renderTournamentBracketPage(socket, token, bracketData, title, description, tournamentId)
{
    //const savedBracket = loadBracketFromStorage(tournamentId);
    //if (savedBracket) {
    //  bracketData = savedBracket;
    //}
    let playerId = null;
    const header = document.getElementById("header");
    header.innerHTML = `
      <div class="tournament-header">
        <div class="header-content">
          <h1>Tournament - ${title}</h1>
          <p>${description}</p>
        </div>
      </div>
    `;
  
    const main = document.getElementById("main");
    main.innerHTML = `
      <div class="container tournament-container">
        <div id="bracket" class="bracket"></div>
      </div>
    `;
  
    renderBracket(bracketData);
  
    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      switch (data.event) {
        case "match_update":
          animateMatchUpdate(data.data);
          break;
        case "round_update":
          animateRoundUpdate(data.data);
          break;
        case "tournament_end":
          showTournamentWinner(data.data.winner);
          break;
        case "incoming_match":
          playerId = data.playerId;
          console.log("Player ID:", playerId);
          socket.send(JSON.stringify({ event: "ready", matchId: data.match_id }));
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
  
  function loadBracketFromStorage(tournamentId)
  {
    // via localStorage or API
    return null;
  }
  
  function renderBracket(bracketData) {
    const bracketEl = document.getElementById("bracket");
    bracketEl.innerHTML = "";
  
    if (bracketData.rounds && Array.isArray(bracketData.rounds)) {
      bracketData.rounds.forEach(round => {
        const roundEl = document.createElement("div");
        roundEl.className = "round";
        roundEl.dataset.round = round.round;
  
        round.matches.forEach(match => {
          const matchEl = createMatchCard(match, round.round);
          roundEl.appendChild(matchEl);
        });
        bracketEl.appendChild(roundEl);
      });
    } else {
      const roundEl = document.createElement("div");
      roundEl.className = "round";
      roundEl.dataset.round = bracketData.round;
  
      bracketData.matches.forEach(match => {
        const matchEl = createMatchCard(match, bracketData.round);
        roundEl.appendChild(matchEl);
      });
      bracketEl.appendChild(roundEl);
    }
  }
  
  function createMatchCard(match, roundNumber) {
    const matchEl = document.createElement("div");
    matchEl.className = "match-card";
    matchEl.dataset.round = roundNumber;
    matchEl.id = `match-${match.matchId}`;
  
    if (match.status === "pending") {
      matchEl.classList.add("in-progress");
    }
  
    matchEl.innerHTML = `
      <div class="match-info">
        <div class="player" data-player="player1">${match.player1}</div>
        <div class="score">${match.score}</div>
        <div class="player" data-player="player2">${match.player2}</div>
      </div>
    `;
    return matchEl;
  }
  
  function animateMatchUpdate(matchData) {
    const matchEl = document.getElementById(`match-${matchData.matchId}`);
    if (matchEl) {
      const scoreEl = matchEl.querySelector(".score");
      scoreEl.textContent = matchData.score;
      matchEl.classList.remove("in-progress");
      matchEl.classList.add("finished");
  
      const players = matchEl.querySelectorAll(".player");
      players.forEach(playerEl => {
        if (playerEl.textContent === matchData.winner) {
          playerEl.classList.add("winner");
        } else {
          playerEl.classList.add("loser");
        }
      });
    }
  }
  
  function animateRoundUpdate(roundData) {
    setTimeout(() => {
      const bracketEl = document.getElementById("bracket");
  
      const newRoundEl = document.createElement("div");
      newRoundEl.className = "round";
      newRoundEl.dataset.round = roundData.round;
      newRoundEl.id = `round-${roundData.round}`;
  
      roundData.matches.forEach(match => {
        const matchEl = createMatchCard(match, roundData.round);
        newRoundEl.appendChild(matchEl);
      });
      bracketEl.appendChild(newRoundEl);
    }, 1000);
  }
  
  function showTournamentWinner(winner) {
    const lastRound = document.querySelector(".round:last-child");
    if (lastRound) {
      const finalMatch = lastRound.querySelector(".match-card");
      if (finalMatch) {
        const playerEls = finalMatch.querySelectorAll(".player");
        let winnerFound = false;
        playerEls.forEach(playerEl => {
          if (playerEl.textContent === winner) {
            playerEl.classList.add("winner");
            winnerFound = true;
          } else {
            playerEl.classList.add("loser");
          }
        });
        if (winnerFound) {
          finalMatch.classList.add("final-win");
          setTimeout(() => {
            finalMatch.classList.add("winner-animation");
          }, 500);
        }
      }
    }
  }
  