import { Game } from "./game.js";

export function loadGame() {
	const game = new Game();
	game.loop();
}
