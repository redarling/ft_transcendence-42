// import loadHeader from "./components/header.js";
// import loadFooter from "./components/footer.js";
// import router from "./js/router.js";

function updateDomContent() {
	// Define routes as an object mapping paths to components or functions
	// url path : function to launch to display and update the dom
	const routes = {
		"/": renderHome,
		"/home": renderHome,
		"/login": renderLogin,
		"/game": renderGame,
		"/settings": renderSettings,
	};

	function router() {
		// get the current path of the website (allow to modify the dom website when the path is modified)
		// can get /login for example
		const path = window.location.pathname;
		// looking for the appropriate function in the map and store this function in renderFunction, this var is a fct
		const renderFunction = routes[path] || renderNotFound;
		// launch the renderFunction, can be renderLogin OR renderGame...
		renderFunction();
	}

	// Load global CSS or other assets.

	// Initialize the DOM with any global components.
	// const app = document.getElementById("app");
	// const header = loadHeader();
	// const footer = loadFooter();
	// document.body.prepend(header);
	// document.body.appendChild(footer);

	// Call the router to render the initial page.
	// router();

	// Attach any global event listeners, if needed.
}


// const lala = 1;



document.addEventListener("DOMContentLoaded", updateDomContent);


// document.addEventListener("DOMContentLoaded", () => {
// 	// Load global CSS or other assets.

// 	// Initialize the DOM with any global components.
// 	const app = document.getElementById("app");
// 	const header = loadHeader();
// 	const footer = loadFooter();
// 	// document.body.prepend(header);
// 	// document.body.appendChild(footer);

// 	// Call the router to render the initial page.
// 	// router();

// 	// Attach any global event listeners, if needed.
// });

// import { render, routes } from "./router.js"; // Import routes and rendering logic

// // Navigate programmatically to a given path and update the browser history.
// const navigateTo = (path) => {
//     try {
//         window.history.pushState({}, "", path);// Update URL without reloading
//         console.log(`Navigating to: ${path}`); // Optional debug log
//         render(path);// Re-render the content
//     }
//     catch (error) {
//         console.error(`Failed to navigate to ${path}:`, error);
//     }
// };

// // Browser back/forward button handling: update the view when history changes.
// window.onpopstate = () => render(window.location.pathname);

// // DOM is fully loaded, initialize the app and setup navigation links.
// document.addEventListener("DOMContentLoaded", () => {
// 	render(window.location.pathname); // Render the current route on page load

// 	// Event delegation for handling navigation clicks.
// 	document.body.addEventListener("click", (e) => {
// 		if (e.target.tagName === "A" && e.target.href.startsWith(window.location.origin)) {
// 			e.preventDefault(); // Prevent default browser navigation
// 			navigateTo(new URL(e.target.href).pathname); // Navigate to the clicked link
// 		}
// 	});
// });
