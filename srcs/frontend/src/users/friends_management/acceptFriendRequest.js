export default async function acceptFriendRequest(friendId) {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        console.error("No access token available");
        return;
    }

    try {
        const response = await fetch("https://transcendence-pong:7443/api/users/friendship/", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({ friend_id: friendId, action: "accept" })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to accept friend request");
        }

        console.log("Friend request accepted:", data);
        loadFriendRequests(); // Refresh the friend request list
    } catch (error) {
        console.error("Error accepting friend request:", error);
    }
}