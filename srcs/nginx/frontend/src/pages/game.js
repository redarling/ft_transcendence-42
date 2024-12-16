import { loadGame } from "../game";

export default function renderGame() {
	const main = document.getElementById("main");
	loadGame();
}