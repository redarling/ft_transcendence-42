import  handleLogout from "./handleLogout.js";

async function refreshToken(){
	const refreshToken = localStorage.getItem('refresh_token');
	if (!refreshToken) {
		console.log('no refresh token found.')
		handleLogout();
		return null;
	}
	try {
		const response = await fetch ('/api/users/token-refresh/', {
			method: 'POST',
			headers:{'Content-Type': 'application/json'},
			body: JSON.stringify({refresh_token: refreshToken}),
		});

		if (!response.ok){
			console.log("Failed to refresh token", response.status);
			handleLogout();
			return null;
		}

		const data = await response.json();
		localStorage.setItem('access_token', data.access_token);
		console.log("New access token set.");
		return data.access_token;
	}
	catch (error){
		console.log("Error during token refreshing:", error);
		return null;
	}

	}

let refreshInterval = null;

export function startTokenRefreshing(){
	console.log("🔄 Starting automatic token refresh...");

	refreshInterval = setInterval(async () => {
		console.log("⏳ Checking if token needs refresh...");
		await refreshToken();
	}, 14 * 60 * 1000);
}

export function stopTokenRefreshing(){
	if (refreshInterval){
		clearInterval(refreshInterval);
		refreshInterval = null;
        console.log("🛑 Stopped token refresh.");
	}
}
