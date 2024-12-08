import { Game } from './game.js';

export let againstBot;

const playAgainstBotButton = document.getElementById('playAgainstBot');
const playLocallyButton = document.getElementById('playLocally');

// Add an option to train the bot or let him keep the same level along all the game

const startGame = (isThereBot) => {
    againstBot = isThereBot;
    const game = new Game();
    game.loop();
};

playAgainstBotButton.addEventListener('click', () => startGame(true));
playLocallyButton.addEventListener('click', () => startGame(false));