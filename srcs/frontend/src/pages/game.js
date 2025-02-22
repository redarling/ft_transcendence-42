import renderFooter from '../components/footer.js';
import renderHeader from '../components/header.js';
import { Game } from '../game/game.js';
import { findMatch } from '../online_gaming/matchmakingHandler.js';
import navigateTo from "../navigation/navigateTo.js"
import showToast from '../utils/toast.js';
import { checkActiveMatch, connectToWebSocket } from '../online_gaming/recoverySystem.js'

export let againstBot;
export let botDifficulty;

export default async function renderGame()
{
    try
    {
        const matchData = await checkActiveMatch(localStorage.getItem('access_token'));
        if (matchData && matchData.active)
            await connectToWebSocket(localStorage.getItem('access_token'), matchData.match_group);
    }
    catch(error)
    {
        await navigateTo("/home");
        showToast(error, "error");
    }

    const matchToastEl = document.getElementById('match-ongoing-toast');
    
    if (matchToastEl)
    {
        const matchToast = new bootstrap.Toast(matchToastEl);
        matchToast.hide();
    }

	const main = document.getElementById("main");
    main.innerHTML = `
        <div class="container-fluid game-mode-container">
            <div class="row w-100 d-flex align-items-center justify-content-evenly">
                <div class="col-md-4 text-center">
                    <div class="card game-card mb-4">
                        <div class="card-body">
                            <h3 class="card-title mb-4">Online Matchmaking</h3>
                            <button type="button" class="btn btn-primary btn-lg btn-game-mode" id="matchmakingBtn">
                                Find Match
                            </button>
                            <p class="text-muted mt-3">Play against random online opponents</p>
                        </div>
                    </div>
                    <div class="card game-card mb-4">
                        <div class="card-body">
                            <h3 class="card-title mb-4">Tournaments</h3>
                            <button type="button" class="btn btn-primary btn-lg btn-game-mode" id="tournamentButton">
                                Browse Tournaments
                            </button>
                            <p class="text-muted mt-3">Compete in organized tournaments</p>
                        </div>
                    </div>
                </div>

                <div class="col-auto d-none d-md-flex d-flex justify-content-center">
                    <div class="vertical-divider"></div>
                </div>

                <div class="col-md-4 text-center">
                    <div class="card game-card mb-4">
                        <div class="card-body">
                            <h3 class="card-title mb-4">Play Against Bot</h3>
                            <div class="difficulty-group">
                                <h5 class="botDifficultyTitle">Bot Difficulty</h5>
                                <div class="btn-group" role="group" aria-label="Basic radio toggle button group">
                                    <input type="radio" class="btn-check" name="btnradio" id="botDifficultyEasy" autocomplete="off">
                                    <label class="btn btn-outline-primary" for="botDifficultyEasy">Easy</label>

                                    <input type="radio" class="btn-check" name="btnradio" id="botDifficultyMedium" autocomplete="off" checked>
                                    <label class="btn btn-outline-primary" for="botDifficultyMedium">Medium</label>
                                
                                    <input type="radio" class="btn-check" name="btnradio" id="botDifficultyHard" autocomplete="off">
                                    <label class="btn btn-outline-primary" for="botDifficultyHard">Hard</label>
                                </div>
                            </div>
                            
                            <button type="button" class="btn btn-success btn-lg btn-game-mode" id="localBotPlayBtn">
                                Play Against Bot
                            </button>
                            <p class="text-muted mt-3">Challenge an AI opponent</p>
                        </div>
                    </div>
                    <div class="card game-card">
                        <div class="card-body">
                            <h3 class="card-title mb-4">Local Multiplayer</h3>
                            <button type="button" class="btn btn-warning btn-lg btn-game-mode" id="localMultiplayerBtn">
                                Play Local Multiplayer
                            </button>
                            <p class="text-muted mt-3">Challenge a friend on the same device</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById("tournamentButton").addEventListener("click", async () => {
        await navigateTo("/tournaments");
    });

    const playAgainstBotButton = document.getElementById('localBotPlayBtn');
    const playLocallyButton = document.getElementById('localMultiplayerBtn');

    const difficultyEasyRadio = document.getElementById('botDifficultyEasy');
    const difficultyMediumRadio = document.getElementById('botDifficultyMedium');
    const difficultyHardRadio = document.getElementById('botDifficultyHard');

    let game = null;

    const startGame = (isThereBot) => {
            
        document.getElementById('main').innerHTML= '';
        document.getElementById('header').innerHTML= '';
        document.getElementById('footer').innerHTML= '';

        const mainDiv = document.getElementById('main');

        // Create a button to leave the game
        const quitButton = document.createElement('button');
        quitButton.id = 'quitButton';
        quitButton.innerText = 'Quit';
        mainDiv.appendChild(quitButton);

        quitButton.addEventListener('click', async () => {
            if (game)
                game.clear();
            await renderHeader();
            await renderGame();
            renderFooter();
        });

        againstBot = isThereBot;
        if (againstBot)
        {
            if (difficultyEasyRadio.checked)
                botDifficulty = 1;
            else if (difficultyMediumRadio.checked)
                botDifficulty = 2;
            else if (difficultyHardRadio.checked)
                botDifficulty = 3;
        }
        game = new Game();
        game.loop();
    };

    playAgainstBotButton.addEventListener('click', () => startGame(true));
    playLocallyButton.addEventListener('click', () => startGame(false));

    // Event listener for matchmaking button
    const matchmakingButton = document.getElementById('matchmakingBtn');
    matchmakingButton.addEventListener('click', async () => {
        await findMatch();
    });
}
