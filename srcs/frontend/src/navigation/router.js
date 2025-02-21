import renderHome from "../pages/home.js"
import renderSettings from "../pages/settings.js"
import renderLogin from "../pages/login.js"
import renderGame from "../pages/game.js"
import renderRegister from "../pages/register.js";
import renderUserProfile from "../pages/profile.js"
import renderTournaments from "../pages/tournaments/tournaments.js";
import render404 from "../pages/utils/404.js";
import { checkActiveMatch, checkActiveTournament, connectToWebSocket } from "../online_gaming/recoverySystem.js";
import TwoFASetup from "../users/two_factor_auth/two_factor_setup.js";
import TwoFARemove from "../users/two_factor_auth/two_factor_remove.js";
import navigateTo from "./navigateTo.js";
import renderPrivacyPolicy from "../pages/privacy.js";
import { tournamentHandler } from "../tournament_gaming/tournamentHandler.js";
import renderContactUs from "../pages/contactUs.js";
import renderForgotPassword from "../pages/forgotPassword.js";
import bracketRecoveryToast from "../utils/bracketRecoveryToast.js"
import matchRecoveryToast from "../utils/matchRecoveryToast.js"
import renderUpdateInformations from "../pages/updateInformations.js";
import renderFriends from "../pages/friends.js"
import isAuthenticated from "../utils/isAuthenticated.js";
import showToast from "../utils/toast.js";

function protectRoute(protectedRoutes = [], guestOnlyRoutes = [])
{
    const path = window.location.pathname;

    if (protectedRoutes.includes(path) && !isAuthenticated())
	{
        navigateTo("/login");
        showToast("You must be logged in to access this page.", "info");
        return true;
    }

    if (guestOnlyRoutes.includes(path) && isAuthenticated())
	{
        navigateTo("/home");
        showToast("You are already logged in.", "info");
        return true;
    }
    
    return false;
}

export default async function router()
{
    console.log("- start: router()");

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
        "/contact-us": renderContactUs,
        "/forgot-password": renderForgotPassword,
        "/update-informations": renderUpdateInformations,
        "/friends": renderFriends
    };

    if (protectRoute(["/game", "/settings", "/friends", 
		"/tournaments", "/2fa-setup", "/2fa-remove", "/update-informations", "/friends"], 
		["/login", "/register", "/forgot-password"]))
	{
		return;
	}

    const path = window.location.pathname;
    const segments = path.split("/").filter(Boolean);
    console.log("The path is:", path);

	if (isAuthenticated())
		await recoverySystem();

    if (segments.length === 2 && segments[0] === "profile" && segments[1])
	{
		if (isAuthenticated())
        	renderUserProfile(segments[1]);
		else
		{
			navigateTo("/login");
			showToast("You must be logged in to access this page.", "error");
		}
    }
	else
	{
        const renderFunction = routes[path] || render404;
        renderFunction();
    }
}

async function recoverySystem()
{
	try
	{
        const token = localStorage.getItem("access_token");
        if (token)
		{
            const matchData = await checkActiveMatch(token);
            if (matchData && matchData.active)
			{
                console.log("Active match found:", matchData);
                matchRecoveryToast();
                const matchToastEl = document.getElementById("match-ongoing-toast");
                const matchToast = new bootstrap.Toast(matchToastEl, {
                    autohide: false,
                    delay: Infinity,
                });
                matchToast.show();
                const matchRecoveryBtn = document.getElementById("restore-match-btn");
                matchRecoveryBtn.addEventListener("click", async () => {
                    matchToast.hide();
                    await connectToWebSocket(token, matchData.match_group);
                });
            }
            const tournament = await checkActiveTournament(token);
            if (tournament && tournament.active)
			{
                console.log("Active tournament found, now restoring the bracket.");
                bracketRecoveryToast();
                const tournamentToastEl = document.getElementById("tournament-ongoing-toast");
                const tournamentToast = new bootstrap.Toast(tournamentToastEl, {
                    autohide: false,
                    delay: Infinity,
                });
                tournamentToast.show();
                const bracketRecoveryBtn = document.getElementById("restore-bracket-btn");
                bracketRecoveryBtn.addEventListener("click", async () => {
                    tournamentToast.hide();
                    const tournamentWebSocketLink = `wss://transcendence-pong:7443/ws/tournament/${tournament.tournament_id}/`;
                    await tournamentHandler(tournamentWebSocketLink, token, tournament.tournament_id);
                });
            }
        }
    }
	catch (error)
	{
        console.error("Error:", error);
    }
}

