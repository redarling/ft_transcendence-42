import navigateTo from "../navigation/navigateTo.js"
import { socket, stopPinging } from "./websocket.js";
import renderHeader from "../components/header.js";
import showToast from "../utils/toast.js";
import showLoadingSpinner from "../utils/spinner.js";

export default async function handleLogout()
{
	console.log("- start: handleLogout()")
	const accessToken = localStorage.getItem("access_token");

    if (!accessToken)
    {
        console.error("No access token found");
        return;
    }

    try
    {
        showLoadingSpinner(true);
		const response = await fetch("/api/users/logout/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const result = await response.json();
        if (response.ok)
        {
            console.log("Logout handling successful");
			localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
			stopPinging();
			if (socket && socket.readyState === WebSocket.OPEN)
                socket.close();
			renderHeader();
			navigateTo("/login");
        } 
		else
        {
            showToast("Logout failed. Try again!", "error");
            console.error("Logout failed:", result.error || result.detail || "An unknown error occurred");
        }
    } 
	catch (error)
    {
        showToast("Network error. Try again!", "error");
    }
    finally
    {
        showLoadingSpinner(false);
    }
}