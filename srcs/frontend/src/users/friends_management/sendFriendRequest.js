import { fetchWithAuth } from "../../utils/fetchWithAuth.js";

export default async function sendFriendRequest(friendId)
{
    try
    {
        const response = await fetchWithAuth("https://transcendence-pong:7443/api/users/friendship/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ friend_id: friendId })
        });

        const data = await response.json();
        if (!response.ok) {
            if (data.message === "Friendship request already exists or is already accepted.") {
                const button = document.getElementById("friendRequestButton");
                if (button) {
                    button.disabled = true;
                    button.textContent = "Request Sent";
                }
            }
            throw new Error(data.message || "Failed to send friend request");
        }

        console.log("Friend request sent successfully:", data);
        const button = document.getElementById("friendRequestButton");
        if (button) {
            button.disabled = true;
            button.textContent = "Request Sent";
        }
    }
    catch (error)
    {
        console.error("Error sending friend request:", error);
    }
}
