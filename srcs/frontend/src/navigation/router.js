import renderHome from "../pages/home.js"
import renderSettings from "../pages/settings.js"
import renderLogin from "../pages/login.js"
import renderGame from "../pages/game.js"
import renderRegister from "../pages/register.js";
import renderUserProfile from "../pages/profile.js"
import renderTournaments from "../pages/tournaments/tournaments.js";
import render404 from "../pages/utils/404.js";
import { getTokenFromUser, checkActiveMatch, checkActiveTournament, connectToWebSocket } from "../online_gaming/recoverySystem.js";
import TwoFASetup from "../users/two_factor_auth/two_factor_setup.js";
import TwoFARemove from "../users/two_factor_auth/two_factor_remove.js";
import navigateTo from "./navigateTo.js";
import renderPrivacyPolicy from "../pages/privacy.js";
import { tournamentHandler } from "../tournament_gaming/tournamentHandler.js";
import rednderContactUs from "../pages/contactUs.js";

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
		"/privacy-policy": renderPrivacyPolicy,
		"/contact-us": rednderContactUs,
		"/forgot-password": renderForgotPassword,
		"/update-informations" : renderUpdateInformations,
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
                matchRecoveryToast();
                const matchToastEl = document.getElementById('match-ongoing-toast');
                const matchToast = new bootstrap.Toast(matchToastEl, {
                    autohide: false,
                    delay: Infinity
                });
                matchToast.show();
                const matchRecoveryBtn = document.getElementById("restore-match-btn");
                matchRecoveryBtn.addEventListener("click", async () => {
                    await connectToWebSocket(token, matchData.match_group);
                    matchToast.hide();
                });

			}
			const tournament = await checkActiveTournament(token);
            if (tournament && tournament.active) {
                console.log("Active tournament found, now restoring the bracket.");
                bracketRecoveryToast();
                const tournamentToastEl = document.getElementById('tournament-ongoing-toast');
                const tournamentToast = new bootstrap.Toast(tournamentToastEl, {
                    autohide: false,
                    delay: Infinity
                });
                tournamentToast.show();
                const bracketRecoveryBtn = document.getElementById("restore-bracket-btn");
                bracketRecoveryBtn.addEventListener("click", async () => {
                    const tournamentWebSocketLink = `wss://transcendence-pong:7443/ws/tournament/${tournament.tournament_id}/`;
                    await tournamentHandler(tournamentWebSocketLink, token, tournament.tournament_id);
                    tournamentToast.hide();
                });

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
