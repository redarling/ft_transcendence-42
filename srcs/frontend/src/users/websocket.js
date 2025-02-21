import { handleLogout } from "./handleLogout.js";
import { refreshToken } from "./tokenRefreshing.js";

let socket = null;
let reconnectTimeout = null;

export function connectWebSocket()
{
    console.log("- function: connectWebSocket()");

    return new Promise((resolve, reject) => {
        if (socket)
        {
            console.warn("⚠️ Closing existing WebSocket before reconnecting...");
            socket.close();
        }

        socket = new WebSocket(`wss://transcendence-pong:7443/ws/status/?token=${localStorage.getItem('access_token')}`);

        socket.onopen = () => {
            console.log("✅ WebSocket Connected!");
            socket.send(JSON.stringify({ type: "pong" }));
            resolve();
        };

        socket.onmessage = (event) => {
            socket.send(JSON.stringify({ type: "pong" }));
        };

        socket.onerror = (error) => {
            console.error("⚠️ WebSocket Error:", error);
            reject(error);
        };

        socket.onclose = async (event) => {
            console.warn("❌ WebSocket Disconnected:", event.reason);

            if (event.code === 1006 || event.code === 4401)
            {
                console.error("🔒 Token expired or invalid. Trying to refresh...");
                
                const refreshed = await refreshToken();
                if (refreshed)
                {
                    console.log("🔄 Token refreshed! Reconnecting WebSocket...");
                    connectWebSocket().catch(console.error);
                }
                else
                {
                    console.error("🚪 Refresh token failed! Logging out...");
                    if (localStorage.getItem('access_token'))
                        handleLogout();
                }
            } 
            else
            {
                if (localStorage.getItem('access_token'))
                {
                    console.warn("🌐 Connection lost. Reconnecting in 5 seconds...");
                    scheduleReconnect();
                }
            }
        };
    });
}

function scheduleReconnect()
{
    if (reconnectTimeout)
        clearTimeout(reconnectTimeout);

    reconnectTimeout = setTimeout(() => {
        connectWebSocket().catch(console.error);
    }, 5000);
}

export function resetSocket()
{
    if (socket && socket.readyState === WebSocket.OPEN)
    {
        console.log("❌ Closing WebSocket...");
        socket.close();
    }
    socket = null;
}