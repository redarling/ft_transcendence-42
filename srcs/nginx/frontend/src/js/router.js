// import Home from "../pages/home.js";
// import Login from "../pages/login.js";
// import loadGame from "../game/index.js";
// import { isAuthenticated } from "./api.js";

// function renderPage(pageName) {
// 	const root = document.getElementById("app"); // Main content container
// 	root.innerHTML = ""; // Clear current content

// 	switch (pageName) {
// 		case "home":
// 			root.appendChild(Home());
// 			break;
// 		case "login":
// 			root.appendChild(Login());
// 			break;
// 		case "game":
// 			if (!isAuthenticated()) {
// 				window.history.pushState(null, null, "/login");
// 				root.appendChild(Login());
// 			} else {
// 				root.appendChild(loadGame());
// 			}
// 			break;
// 		default:
// 			root.innerHTML = "<h1>404 - Page Not Found</h1>";
// 	}
// }

// export function router() {
// 	const routes = {
// 		"/": "home",
// 		"/login": "login",
// 		"/game": "game",
// 	};
// 	const route = routes[window.location.pathname];
// 	renderPage(route || "home");
// }

// window.onpopstate = router;


// ANOTHER Alternative

// router.js
export const routes = {
	'/': 'home',
	'/login': 'login',
	'/game': 'game',
};

export const render = (route) => {
	const app = document.getElementById('app');
	app.innerHTML = ''; // Clear current content
	switch (route) {
		case '/':
			app.innerHTML = `
				<header>${Header()}</header>
				<main>${Home()}</main>
				<footer>${Footer()}</footer>`;
			b
			
			reak;
		case '/login':
			app.innerHTML = `
				<header>${Header()}</header>
				<main>${Login()}</main>`;
			break;
		case '/game':
			app.innerHTML = `
				<main>${Game()}</main>`;
			break;
		default:
			app.innerHTML = `
				<main><h1>404 - Page Not Found</h1></main>`;
	}
};

export default function router() {
	const route = routes[window.location.pathname];
	render(route || '/');
}

window.onpopstate = router;
