import renderHeader from "./components/header.js";
import renderFooter from "./components/footer.js";
import renderHome from "./pages/home.js"
import renderSettings from "./pages/settings.js"
import renderLogin from "./pages/login.js"
import renderGame from "./pages/game.js"
import renderRegister from "./pages/register.js";
import renderUserProfile from "./pages/profile.js"
import renderTournaments from "./pages/tournaments/tournaments.js";
import render404 from "./pages/utils/404.js";
import { getTokenFromUser, checkActiveMatch, connectToWebSocket } from "./online_gaming/recoverySystem.js";

// Define routes as an object mapping paths to components or functions
// url path : function to launch to display and update the dom
const routes = {
	"/": renderHome,
	"/home": renderHome,
	"/login": renderLogin,
	"/register": renderRegister,
	"/settings": renderSettings,
	"/game": renderGame,
    "/profile": renderUserProfile,
	"/tournaments": renderTournaments
};

async function router() {
	// get the current path of the website (ex: /login)
	const path = window.location.pathname;
	console.log("the path is :", path);

	// looking for the appropriate function in the map and store this function in renderFunction, this var is a fct
	const renderFunction = routes[path] || render404;

    try {
        const token = await getTokenFromUser();
        if (token) {
            const matchData = await checkActiveMatch(token);
            if (matchData && matchData.active) {
                console.log("Active match found:", matchData);
                await connectToWebSocket(token, matchData.match_group);
            } 
			else {
                console.log("No active match found.");
            }
        }
    }
	catch (error) {
        console.error("Error during router initialization:", error);
    }
	
	// launch the renderFunction, can be renderLogin OR renderGame...
	renderFunction();
}

function renderStaticElements() {
	renderHeader();
	renderFooter();
}

function createDivBlocks() {
	const app = document.getElementById("app");
	app.innerHTML = `
		<div id="header"></div>
		<div id="main"></div>
		<div id="footer"></div>
	`
}

function updateDomContent() {
	createDivBlocks();
	renderStaticElements();
	router();
}

export default function navigateTo(path) {
    history.pushState({}, "", path);
    router();
}

document.addEventListener("DOMContentLoaded", updateDomContent);
window.addEventListener("popstate", router);
