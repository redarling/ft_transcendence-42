import navigateTo from "../navigation/navigateTo.js"
import { socket, stopPinging } from "./websocket.js";
import renderHeader from "../components/header.js";

export default async function handleLogout() {
	console.log("- start: handleLogout()")
	const accessToken = localStorage.getItem("access_token");

    try {
		console.log("logout fetching...");
		const response = await fetch("/api/users/logout/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
        });

        if (response.ok) {
            console.log("removing tokens...");
			localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            console.log("stopping pong ...");
			stopPinging();
            console.log("close socket ...");
			if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
			renderHeader();
			console.log("move to login page");
			navigateTo("/login");
        } 
		else {
            console.error("Logout failed:", await response.json());
        }
    } 
	catch (error) {
        console.error("Network error during logout:", error);
    }
}