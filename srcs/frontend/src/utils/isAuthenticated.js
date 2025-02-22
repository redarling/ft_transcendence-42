import { refreshToken } from "../users/tokenRefreshing.js";

export default async function isAuthenticated()
{
    const token = localStorage.getItem("access_token");
    if (!token || token == "undefined")
        return false;
    
    try
    {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        if (payload.exp > currentTime)
        {
            return true;
        }
        else
        {
            console.warn("🔄 Access-token expired! Trying to refresh...");
            return await refreshToken();
        }
    }
    catch (error)
    {
        console.error("❌ Invalid token format, trying refresh:", error);
        return await refreshToken();
    }
}
