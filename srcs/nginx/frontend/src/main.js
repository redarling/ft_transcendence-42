import renderHeader from "./components/header.js";
import renderFooter from "./components/footer.js";
import renderHome from "./pages/home.js"
import renderSettings from "./pages/settings.js"
import renderLogin from "./pages/login.js"
import renderGame from "./pages/game.js"

function router() {
	// Define routes as an object mapping paths to components or functions
	// url path : function to launch to display and update the dom
	const routes = {
		"/login": renderLogin,
		"/": renderHome,
		"/home": renderHome,
		"/settings": renderSettings,
		"/game": renderGame
	};

	// get the current path of the website (allow to modify the dom website when the path is modified)
	// can get /login for example
	const path = window.location.pathname;
	console.log("the path is :", path, "so that's the path");
	
	// looking for the appropriate function in the map and store this function in renderFunction, this var is a fct
	const renderFunction = routes[path] || renderNotFound;
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
	// Initialization
	createDivBlocks();
	renderStaticElements();
	router();
	// Detect dom updates
}

document.addEventListener("DOMContentLoaded", updateDomContent); // Once the page is loaded




// Load global CSS or other assets.
// Initialize the DOM with any global components.
// const app = document.getElementById("app");
// document.body.prepend(header);
// document.body.appendChild(footer);
