import { handleLogout } from "./handleLogout.js";
import showToast from "../utils/toast.js";

let refreshInterval = null;

export async function refreshToken()
{
	try
	{
		const response = await fetch("/api/users/token-refresh/", {
			method: "POST",
			credentials: "include",
		});

		const result = await response.json();
		
		if (response.ok)
		{
			localStorage.setItem('access_token', result.access_token);
			console.log("Access token refreshed successfully.");
			return true;
		}
		else
		{
			console.warn("Token refresh failed:", result.error);
			showToast("Session expired. Please log in again.", "error");
			if (localStorage.getItem('access_token'))
				handleLogout();
			return false;
		}
	}
	catch (error)
	{
		console.warn("Network error during token refresh:", error);
		showToast("Network error. Please check your connection.", "error");
		handleLogout();
	}
}

export function startTokenRefreshing()
{
	stopTokenRefreshing();

	refreshInterval = setInterval(refreshToken, 14 * 60 * 1000);
	console.log("Token refreshing started.");
}

export function stopTokenRefreshing()
{
	if (refreshInterval)
	{
		clearInterval(refreshInterval);
		refreshInterval = null;
		console.log("Token refreshing stopped.");
	}
}

