import { fetchWithAuth } from "../../utils/fetchWithAuth.js";

export default async function acceptFriendRequest(friendId)
{
    try
    {
        const response = await fetchWithAuth("/api/users/friendship/", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
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