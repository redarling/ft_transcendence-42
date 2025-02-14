import renderHome from "../pages/home.js"
import renderSettings from "../pages/settings.js"
import renderLogin from "../pages/login.js"
import renderGame from "../pages/game.js"
import renderRegister from "../pages/register.js";
import renderUserProfile from "../pages/profile.js"
import renderTournaments from "../pages/tournaments/tournaments.js";
import render404 from "../pages/utils/404.js";
import { getTokenFromUser, checkActiveMatch, connectToWebSocket } from "../online_gaming/recoverySystem.js";
import TwoFASetup from "../users/TWOFA/TwoFa_setup.js";
import TwoFARemove from "../users/TWOFA/TwoFa_remove.js";
import navigateTo from "./navigateTo.js";

export default async function router() {
	console.log("- start: router()")
	const routes = {
		"/": renderHome,
		"/home": renderHome,
		"/login": renderLogin,
		"/register": renderRegister,
		"/settings": renderSettings,
		"/game": renderGame,
		"/tournaments": renderTournaments,
		"/2fa-setup": TwoFASetup,
		"/2fa-remove": TwoFARemove,
	};
	
	const path = window.location.pathname;
	const segments = path.split("/").filter(Boolean);
	console.log("the path is :", path);

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

	const isAuthenticated = localStorage.getItem("access_token") !== null;
	if (isAuthenticated && (path === "/login" || path === "/register")) {
	    console.log("🔄 Redirecting to /home...");
		navigateTo("/home");
	}

	if (segments.length === 2 && segments[0] === "profile" && segments[1]) {
		console.log("Rendering user profile");
		renderUserProfile(segments[1]);
	} 
	else {
		const renderFunction = routes[path] || render404;
		renderFunction();
	}
}
