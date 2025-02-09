export let socket = null;
let pingInterval = null;

export default function connectWebSocket() {
	// console.log("- start: connectWebSocket()")
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
        // console.warn("No access token found. Skipping WebSocket connection.");
        return;
    }

    // 🔹 Establish WebSocket connection with token authentication
    socket = new WebSocket(`wss://127.0.0.1:7443/ws/status/?token=${accessToken}`);

    socket.onopen = () => {
        // console.log("✅ WebSocket Connected!");
        startPinging();
    };

    socket.onmessage = (event) => {
        // console.log("📩 Message from server:", event.data);
    };

    socket.onerror = (error) => {
        // console.error("⚠️ WebSocket Error:", error);
    };

    socket.onclose = (event) => {
        // console.warn("❌ WebSocket Disconnected:", event.reason);
        stopPinging();
		socket = null;

		setTimeout(connectWebSocket, 5000);
	};
}

// 🔹 Function to send "pong" messages every 5 seconds
function startPinging() {
    pingInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send("pong");
            console.log("📤 Sent: pong");
        }
    }, 5000);
}

// 🔹 Stop sending "pong" messages
export function stopPinging() {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }
}
