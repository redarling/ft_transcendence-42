import navigateTo from "../navigation/navigateTo.js"
import renderHeader from "../components/header.js";
import showToast from "../utils/toast.js";
import showLoadingSpinner from "../utils/spinner.js";
import { stopTokenRefreshing } from "./tokenRefreshing.js";
import { resetSocket } from "./websocket.js";

export async function handleLogout()
{
	console.log("- function: handleLogout()");
    
    try
    {
        showLoadingSpinner(true);
		const response = await fetch("/api/users/logout/", {
            method: "POST",
            credentials: "include"
        });

        if (response.ok)
        {
            clearUserData();
            navigateTo("/login");
        } 
		else
		{
            console.log("❌ Logout failed:", result.error);
			const result = await response.json();
            clearUserData();
			navigateTo("/login");
			showToast(result.error || "Unknown error. Please, try again.", "error");
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

function clearUserData()
{
    stopTokenRefreshing();
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    resetSocket();
    renderHeader();
}
