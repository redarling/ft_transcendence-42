import renderFooter from '../components/footer.js';
import renderHeader from '../components/header.js';
import renderGame from '../pages/game.js';
import { Game } from '../game/onlineGame.js';

function renderPageTemplate({ header = true, footer = true, content = '' })
{
    const   main = document.getElementById("main");
    main.innerHTML = '';
    
    if (header)
    {
        document.getElementById('header').innerHTML = '';
        renderHeader();
    }

    if (footer)
    {
        document.getElementById('footer').innerHTML = '';
        renderFooter();
    }

    main.innerHTML = content;
}

// Search match waiting page
export function renderSearchingPage(socket)
{
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
        if (socket.readyState === WebSocket.OPEN)
        {
            socket.close();
        }
    });
}

// Error page
export function renderErrorPage(message)
{
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

export function renderMatch(socket, playerId, player1Username, player2Username, player1Avatar, player2Avatar, isCountdown) {

    document.getElementById('main').innerHTML = '';
    document.getElementById('header').innerHTML = '';
    document.getElementById('footer').innerHTML = '';

    const nicknamesDiv = document.createElement('div');
    nicknamesDiv.id = 'nicknames';
    nicknamesDiv.style.position = 'absolute';
    nicknamesDiv.style.top = '0';
    nicknamesDiv.style.width = '100%';
    nicknamesDiv.style.display = 'flex';
    nicknamesDiv.style.justifyContent = 'space-between';
    nicknamesDiv.style.padding = '10px';
    nicknamesDiv.style.zIndex = '1000';

    const player1Container = document.createElement('div');
    player1Container.style.display = 'flex';
    player1Container.style.alignItems = 'center';
    player1Container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    player1Container.style.padding = '10px';
    player1Container.style.borderRadius = '8px';
    player1Container.style.marginLeft = '10px';

    const player1AvatarImg = document.createElement('img');
    player1AvatarImg.src = player1Avatar;
    player1AvatarImg.alt = `${player1Username} Avatar`;
    player1AvatarImg.style.width = '50px';
    player1AvatarImg.style.height = '50px';
    player1AvatarImg.style.borderRadius = '50%';
    player1AvatarImg.style.marginRight = '10px';

    const player1Nickname = document.createElement('span');
    player1Nickname.textContent = player1Username;
    player1Nickname.style.color = '#fff';
    player1Nickname.style.fontSize = '18px';
    player1Nickname.style.fontWeight = 'bold';

    player1Container.appendChild(player1AvatarImg);
    player1Container.appendChild(player1Nickname);

    const player2Container = document.createElement('div');
    player2Container.style.display = 'flex';
    player2Container.style.alignItems = 'center';
    player2Container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    player2Container.style.padding = '10px';
    player2Container.style.borderRadius = '8px';
    player2Container.style.marginRight = '10px';

    const player2AvatarImg = document.createElement('img');
    player2AvatarImg.src = player2Avatar;
    player2AvatarImg.alt = `${player2Username} Avatar`;
    player2AvatarImg.style.width = '50px';
    player2AvatarImg.style.height = '50px';
    player2AvatarImg.style.borderRadius = '50%';
    player2AvatarImg.style.marginRight = '10px';

    const player2Nickname = document.createElement('span');
    player2Nickname.textContent = player2Username;
    player2Nickname.style.color = '#fff';
    player2Nickname.style.fontSize = '18px';
    player2Nickname.style.fontWeight = 'bold';

    player2Container.appendChild(player2AvatarImg);
    player2Container.appendChild(player2Nickname);

    nicknamesDiv.appendChild(player1Container);
    nicknamesDiv.appendChild(player2Container);

    document.body.appendChild(nicknamesDiv);

    const game = new Game(socket, playerId, isCountdown);
    game.loop();
}

export function handleMatchOver(winner, player1Score, player2Score, playerId)
{
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

export function disconnectionMessage()
{
    const notification = document.createElement("div");
    notification.id = "disconnection-notification";
    notification.style.position = "absolute";
    notification.style.top = "20px";
    notification.style.right = "20px";
    notification.style.backgroundColor = "rgba(255, 0, 0, 0.8)";
    notification.style.color = "#fff";
    notification.style.padding = "15px 20px";
    notification.style.borderRadius = "8px";
    notification.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    notification.style.zIndex = "1000";
    notification.style.fontSize = "16px";
    notification.style.textAlign = "center";
    notification.style.maxWidth = "300px";

    notification.textContent = "Player disconnected. Match will be finished in 20 seconds if the player doesn't return.";

    document.body.appendChild(notification);

    setTimeout(() => {
        if (document.getElementById("disconnection-notification"))
        {
            document.getElementById("disconnection-notification").remove();
        }
    }, 5000);
}