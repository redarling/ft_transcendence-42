import renderFooter from '../components/footer.js';
import renderHeader from '../components/header.js';
import renderGame from '../pages/game.js';
import { Game } from '../game/onlineGame.js';

function renderPageTemplate({ header = true, footer = true, content = '' }) {
    const main = document.getElementById("main");
    main.innerHTML = '';
    
    if (header) {
        document.getElementById('header').innerHTML = '';
        renderHeader();
    }

    if (footer) {
        document.getElementById('footer').innerHTML = '';
        renderFooter();
    }

    main.innerHTML = content;
}

// Search match waiting page
export function renderSearchingPage(socket) {
    const content = `
        <div class="container-fluid matchmaking-container d-flex flex-column align-items-center justify-content-center text-center">
            <h1 class="display-4 mb-4">Searching...</h1>
            <div class="spinner-border text-primary" role="status" style="width: 4rem; height: 4rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-4 text-muted">Looking for an opponent. Please wait...</p>
            
            <button class="btn btn-danger mt-4" id="cancelSearchBtn">Cancel Search</button>
        </div>
    `;

    renderPageTemplate({ content });


    const cancelSearchButton = document.getElementById('cancelSearchBtn');
    cancelSearchButton.addEventListener('click', () => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ event: "cancel_search" }));
            socket.close();
        }
        renderGame();
    });
}

// Error page
export function renderErrorPage(message) {
    const content = `
        <div class="container-fluid error-container d-flex flex-column align-items-center justify-content-center text-center">
            <h1 class="display-4 mb-4 text-danger">Error</h1>
            <p class="text-muted mb-4">${message}</p>
            <button class="btn btn-primary" id="returnHomeBtn">Return to Home</button>
        </div>
    `;

    renderPageTemplate({ content });

    const returnHomeButton = document.getElementById('returnHomeBtn');
    returnHomeButton.addEventListener('click', () => {
        renderGame();
    });
}

export function renderMatch(socket, playerId) {

    document.getElementById('main').innerHTML= '';
    document.getElementById('header').innerHTML= '';
    document.getElementById('footer').innerHTML= '';
    const game = new Game(socket, playerId);
    game.loop();
}

/**
 * Handle the "match_over" event.
 * @param {Object} data - The event data containing match results.
 * @param {string} playerId - The ID of the current player.
 */
export function handleMatchOver(data, playerId) {
    const winner = data.winner;
    const player1Score = data.player1_score;
    const player2Score = data.player2_score;
    const isWinner = winner === playerId;

    // Create modal for match results
    const modal = document.createElement("div");
    modal.id = "match-result-modal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100vw";
    modal.style.height = "100vh";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "9999";
    modal.style.color = "#fff";

    const resultText = document.createElement("h1");
    resultText.textContent = isWinner ? "YOU WON!" : "YOU LOST!";
    resultText.style.marginBottom = "20px";

    const scoreText = document.createElement("p");
    scoreText.textContent = `Final Score: ${player1Score} - ${player2Score}`;
    scoreText.style.marginBottom = "30px";

    const returnButton = document.createElement("button");
    returnButton.textContent = "RETURN";
    returnButton.style.padding = "10px 20px";
    returnButton.style.fontSize = "16px";
    returnButton.style.cursor = "pointer";
    returnButton.onclick = () => {
        // Remove modal and redirect user to the main screen
        modal.remove();
        renderHeader();
        renderGame();
        renderFooter();
    };

    modal.appendChild(resultText);
    modal.appendChild(scoreText);
    modal.appendChild(returnButton);
    document.body.appendChild(modal);
}