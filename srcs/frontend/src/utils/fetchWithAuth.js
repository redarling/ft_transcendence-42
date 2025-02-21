import { refreshToken } from "../users/tokenRefreshing.js";

export async function fetchWithAuth(url, options = {})
{
    if (!options.headers)
        options.headers = {};
    
    options.headers["Authorization"] = `Bearer ${localStorage.getItem('access_token')}`;

    let response = await fetch(url, options);

    if (response.status === 401)
    {
        await refreshToken();
        options.headers["Authorization"] = `Bearer ${localStorage.getItem('access_token')}`;
        response = await fetch(url, options);
    }

    return response;
}
