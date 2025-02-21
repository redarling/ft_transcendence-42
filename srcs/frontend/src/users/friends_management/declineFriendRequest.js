import { fetchWithAuth } from "../../utils/fetchWithAuth.js";

export default async function declineFriendRequest(friendId)
{
    try {
        const response = await fetchWithAuth("/api/users/friendship/", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ friend_id: friendId, action: "decline" })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to decline friend request");
        }

        console.log("Friend request declined:", data);
        loadFriendRequests(); // Refresh the friend request list
    } catch (error) {
        console.error("Error declining friend request:", error);
    }
}
