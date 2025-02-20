import  { clearUserData } from "./handleLogout.js";

let refreshInterval = null;

async function refreshToken()
{
	const refreshToken = localStorage.getItem('refresh_token');
	
	if (!refreshToken)
	{
		console.log('no refresh token found.');
		clearUserData();
		return null;
	}

	try
	{
		const response = await fetch ('/api/users/token-refresh/', {
			method: 'POST',
			headers:{'Content-Type': 'application/json'},
			body: JSON.stringify({refresh_token: refreshToken}),
		});

		if (!response.ok)
		{
			console.log("Failed to refresh token", response.status);
			clearUserData();
			return null;
		}

		const data = await response.json();
		localStorage.setItem('access_token', data.access_token);
		console.log("New access token set.");
		return data.access_token;
	}
	catch (error)
	{
		console.log("Error during token refreshing:", error);
		return null;
	}
}

export function startTokenRefreshing()
{
	refreshInterval = setInterval(async () => {
		await refreshToken();
	}, 14 * 60 * 1000);
}

export function stopTokenRefreshing()
{
	if (refreshInterval)
	{
		clearInterval(refreshInterval);
		refreshInterval = null;
        console.log("🛑 Stopped token refresh.");
	}
}
