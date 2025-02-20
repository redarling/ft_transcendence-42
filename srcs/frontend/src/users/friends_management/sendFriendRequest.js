export default async function sendFriendRequest(friendId) {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        console.error("No access token available");
        return;
    }

    try {
        const response = await fetch("https://transcendence-pong:7443/api/users/friendship/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
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
    } catch (error) {
        console.error("Error sending friend request:", error);
    }
}
