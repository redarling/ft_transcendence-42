export let socket = null;

function openWebSocket(accessToken){
	console.log("- start: openWebSocket()")
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
		socket = null;
	};
}

export default function connectWebSocket() {
	console.log("- start: connectWebSocket()")
	const accessToken = localStorage.getItem("access_token");
    if (!accessToken)
		return ;
	openWebSocket(accessToken);
}

