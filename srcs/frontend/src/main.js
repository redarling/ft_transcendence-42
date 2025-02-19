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
        <div id="toast-container" class="toast-container position-fixed bottom-0 end-0 p-3"></div>
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
	const accessToken = localStorage.getItem("access_token");
	if (accessToken)
		connectWebSocket();
	updateDomContent();
});

window.addEventListener("popstate", router);
