import renderHeader from "./components/header.js";
import renderFooter from "./components/footer.js";
import connectWebSocket from "./users/websocket.js";
import router from "./navigation/router.js"

function renderStaticElements() {
	console.log("- start: renderStaticElements()")
	renderHeader();
	renderFooter();
}

function createDivBlocks() {
	console.log("- start: createDivBlocks()")
	const app = document.getElementById("app");
	app.innerHTML = `
		<div id="header"></div>
		<div id="main"></div>
		<div id="footer"></div>
	`
}

function updateDomContent() {
	console.log("- start: updateDomContent()")
	createDivBlocks();
	renderStaticElements();
	router();
}

document.addEventListener("DOMContentLoaded", () => {
	console.log("- start: Dom content loaded");
	updateDomContent();
	const accessToken = localStorage.getItem("access_token");
	if (accessToken)
		connectWebSocket();
});

window.addEventListener("popstate", router);
