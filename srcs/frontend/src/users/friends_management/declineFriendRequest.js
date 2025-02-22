import { fetchWithAuth } from "../../utils/fetchWithAuth.js";
import showToast from "../../utils/toast.js";
import { loadFriendRequests } from "../../pages/friends.js"

export default async function declineFriendRequest(friendId)
{
    try
    {
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

        showToast("Friend request successfully denied.", "success");
        loadFriendRequests(); // Refresh the friend request list
    } catch (error) {
        showToast(error, "error");
    }
}
