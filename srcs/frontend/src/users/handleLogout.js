import navigateTo from "../navigation/navigateTo.js"
import { socket } from "./websocket.js";
import renderHeader from "../components/header.js";
import showToast from "../utils/toast.js";
import showLoadingSpinner from "../utils/spinner.js";
import { stopTokenRefreshing } from "./tokenRefreshing.js";

export async function handleLogout()
{
	console.log("- function: handleLogout()")
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
            stopTokenRefreshing();
            clearUserData();
            navigateTo("/login");
        } 
		else
		{
			console.log("we should take a look to check what happens before u pass in this condition");

            clearUserData();
			navigateTo("/login");
			showToast(result.error || result.detail || "Unknown error. Please, try again.", "error");
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

export function clearUserData()
{	
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    if (socket && socket.readyState === WebSocket.OPEN)
        socket.close();
    renderHeader();
}