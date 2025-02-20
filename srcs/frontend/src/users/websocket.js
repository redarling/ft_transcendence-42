import handleLogout from "./handleLogout.js";

export let socket = null;

function openWebSocket(accessToken){
	console.log("- function: openWebSocket()")
	socket = new WebSocket(`wss://transcendence-pong:7443/ws/status/?token=${accessToken}`);

    socket.onopen = () => {
		console.log("✅ WebSocket Connected!");
		socket.send(JSON.stringify({ type: "pong" }));
    };

    socket.onmessage = (event) => {
        console.log("📩 Sending pong:", event.data);
		socket.send(JSON.stringify({ type: "pong" }));
	};

    socket.onerror = (error) => {
        console.error("⚠️ WebSocket Error:", error);
    };

    socket.onclose = (event) => {
        console.warn("❌ WebSocket Disconnected:", event.reason);
		// Handle authentication failure
		if (event.code === 1006) {
			console.error("⚠️ Possible authentication issue (token expired or invalid)");
		} 
		else if (event.code === 4401) {
			console.error("🔒 Unauthorized: Invalid or expired token");
		}
		
		socket = null;
		handleLogout();
	};
}

export default function connectWebSocket() {
	console.log("- function: connectWebSocket()")
	const accessToken = localStorage.getItem("access_token");
    if (!accessToken)
		return ;
	openWebSocket(accessToken);
}

