import { handleLogout } from "./handleLogout.js";

let isRefreshing = false;
let refreshSubscribers = [];

export async function refreshToken()
{
	if (isRefreshing)
	{
		console.warn("⏳ Refresh already in progress. Waiting...");
		return new Promise((resolve) => {
			refreshSubscribers.push(resolve);
		});
	}

	isRefreshing = true;

	try
	{
		console.log("🔄 Refreshing access token...");
		const response = await fetch("/api/users/token-refresh/", { 
			method: 'POST',
            credentials: 'include'
        });

		const result = await response.json();
		

		if (!response.ok)
		{
			await handleLogout();
			refreshSubscribers.forEach((callback) => callback(true));
			return false;
		}
		else
		{
			console.log("✅ Token refreshed!");
			const newAccessToken = result.access_token;
			localStorage.setItem('access_token', newAccessToken);
			isRefreshing = false;
			refreshSubscribers.forEach((callback) => callback(false));
			refreshSubscribers = [];
			return true;
		}
	}
	catch (error)
	{
		console.error("❌ Refresh token failed:", error);
		isRefreshing = false;
		await handleLogout();
		refreshSubscribers.forEach((callback) => callback(false));
		refreshSubscribers = [];
		return false;
	}
}
			