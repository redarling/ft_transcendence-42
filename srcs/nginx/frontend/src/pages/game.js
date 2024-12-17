import { Game } from '../game/game.js';

export let againstBot;
export let botDifficulty;

export default function renderGame() {
	const main = document.getElementById("main");
	main.innerHTML = `
        <h2>Play</h2>
        <fieldset>
            <legend>Play against an AI</legend>
            <div>
                <input type="radio" id="difficultyEasy" name="difficulty" value="easy" checked>
                <label for="difficultyEasy"> Easy </label>

                <input type="radio" id="difficultyMedium" name="difficulty" value="medium">
                <label for="difficultymedium"> Medium </label>

                <input type="radio" id="difficultyHard" name="difficulty" value="hard">
                <label for="difficultyHard"> Hard </label>
            </div>
            <button id="playAgainstBot">Play</button>
        </fieldset>

        <fieldset>
            <legend>Play locally</legend>
                <button id="playLocally">Play</button>
        </fieldset>
    `
    const playAgainstBotButton = document.getElementById('playAgainstBot');
    const playLocallyButton = document.getElementById('playLocally');

    const difficultyEasyRadio = document.getElementById('difficultyEasy');
    const difficultyMediumRadio = document.getElementById('difficultyMedium');
    const difficultyHardRadio = document.getElementById('difficultyHard');

    const startGame = (isThereBot) => {
        againstBot = isThereBot;
        if (againstBot) {
            if (difficultyEasyRadio.checked) {
                botDifficulty = 1;
            } else if (difficultyMediumRadio.checked) {
                botDifficulty = 2;
            } else if (difficultyHardRadio.checked) {
                botDifficulty = 3;
            }
        }
        const game = new Game();
        game.loop();
    };

    playAgainstBotButton.addEventListener('click', () => startGame(true));
    playLocallyButton.addEventListener('click', () => startGame(false));
}