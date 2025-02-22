import { fetchWithAuth } from "../../utils/fetchWithAuth.js";
import { loadFriendRequests, loadFriends } from "../../pages/friends.js"
import showToast from "../../utils/toast.js";

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

        showToast("Friend request successfully accepted.", "success");
        loadFriendRequests(); // Refresh the friend request list
        loadFriends();
    } catch (error) {
        showToast(error, "error");
    }
}
