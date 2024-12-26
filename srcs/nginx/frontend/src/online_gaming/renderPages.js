import renderFooter from '../components/footer.js';
import renderHeader from '../components/header.js';
import renderGame from '../pages/game.js';

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

// Placeholder for redirection after match found
export function renderMatchPlaceholder() {
    const content = `
        <div class="container text-center mt-5">
            <h1 class="display-4">Match Found!</h1>
            <p class="text-muted">Redirecting to your match...</p>
        </div>
    `;

    renderPageTemplate({ content });
}