import { refreshToken } from "../users/tokenRefreshing.js";

export async function fetchWithAuth(url, options = {})
{
    console.log("- function: fetchWithAuth()");

    if (!options.headers)
        options.headers = {};

    options.headers["Authorization"] = `Bearer ${localStorage.getItem('access_token')}`;

    let response = await fetch(url, options);

    if (response.status === 401)
    {
        console.warn("🔄 Token expired! Trying to refresh...");

        const refreshed = await refreshToken();
        if (refreshed)
        {
            console.log("✅ Token refreshed! Retrying request...");
            options.headers["Authorization"] = `Bearer ${localStorage.getItem('access_token')}`;
            response = await fetch(url, options);
        }
        else
        {
            console.error("🚪 Refresh failed! Logging out...");
            handleLogout();
        }
    }

    return response;
}
