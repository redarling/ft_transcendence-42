import renderHeader from "./components/header.js";
import renderFooter from "./components/footer.js";
import { connectWebSocket } from "./users/websocket.js";
import router from "./navigation/router.js"
import isAuthenticated from "./utils/isAuthenticated.js";

async function renderStaticElements()
{
	await renderHeader();
	renderFooter();
}

function createDivBlocks()
{
	const app = document.getElementById("app");
	app.innerHTML = `
		<div id="header"></div>
		<div id="main"></div>
		<div id="footer"></div>
        <div id="toast-container" class="toast-container position-fixed bottom-0 end-0 p-3"></div>
	`
}

async function updateDomContent()
{
	console.log("- function: updateDomContent()")
	createDivBlocks();
	await renderStaticElements();
	await router();
}

document.addEventListener("DOMContentLoaded", async () => {
	console.log("- function: Dom content loaded");
    try
	{
		if (await isAuthenticated())
			await connectWebSocket();
    }
	catch (error)
	{
        console.error("❌ WebSocket connection failed:", error);
    }
	await updateDomContent();
});

window.addEventListener("popstate", async () => {
    await router();
});
