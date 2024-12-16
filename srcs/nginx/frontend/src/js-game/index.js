import { Game } from './game.js';

export let againstBot;
export let botDifficulty;

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