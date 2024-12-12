// import loadHeader from "./components/header.js";
// import loadFooter from "./components/footer.js";
// import router from "./js/router.js";

function router() {
	// Define routes as an object mapping paths to components or functions
	// url path : function to launch to display and update the dom
	const routes = {
		"/": renderHome,
		"/home": renderHome,
		"/login": renderLogin,
		"/game": renderGame,
		"/settings": renderSettings,
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

function updateDomContent() {

	// Load global CSS or other assets.

	// Initialize the DOM with any global components.
	// const app = document.getElementById("app");
	// const header = loadHeader();
	// const footer = loadFooter();
	// document.body.prepend(header);
	// document.body.appendChild(footer);

	// Call the router to render the initial page.
	// router();


// continue on it:
history.pushState()

	document.addEventListener("click", (event) => {
		document.getElementById("app").innerHTML = `
			<h1>Game</h1>
			<p>Game content</p>
		`;
	});




	// Attach any global event listeners, if needed.
}

document.addEventListener("DOMContentLoaded", updateDomContent);
