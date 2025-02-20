import { refreshToken } from "../users/tokenRefreshing.js";

export default function isAuthenticated()
{
    const token = localStorage.getItem("access_token");
    if (!token) return false;

    try
    {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp > currentTime;
        refreshToken();
    }
    catch (error)
    {
        return false;
    }
}
