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

        const token = localStorage.getItem('access_token');
        
        if (!token || token == "undefined")
        {
            console.error("🔒 No token found! Can't connect WebSocket.")
            reject("No token found");
            return;
        }

        socket = new WebSocket(`wss://transcendence-pong:7443/ws/status/?token=${token}`);

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
                    if (socket)
                    {
                        socket.onclose = null;
                        socket.close();
                        socket = null;
                    }
                    await handleLogout();
                }
            }
            else
            {
                console.warn("🌐 Connection lost. Reconnecting in 5 seconds...");
                scheduleReconnect();
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

export function checkSocket()
{
    return socket && socket.readyState === WebSocket.OPEN;
}