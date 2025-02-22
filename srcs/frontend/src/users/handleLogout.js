import navigateTo from "../navigation/navigateTo.js"
import renderHeader from "../components/header.js";
import showToast from "../utils/toast.js";
import showLoadingSpinner from "../utils/spinner.js";
import { resetSocket } from "./websocket.js";

export async function handleLogout()
{
	console.log("- function: handleLogout()");
    
    if (!localStorage.getItem('access_token'))
    {
        console.warn("🔒 Not logged in. Skipping logout...");
        return;
    }
    try
    {
        showLoadingSpinner(true);
		
        const response = await fetch("/api/users/logout/", {
            method: "POST",
            credentials: "include"
        });

        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        resetSocket();
        await navigateTo("/login");
        await renderHeader();
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
