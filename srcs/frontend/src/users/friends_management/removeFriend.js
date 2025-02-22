import showToast from "../../utils/toast.js";
import { loadFriends } from "../../pages/friends.js"
import { fetchWithAuth } from "../../utils/fetchWithAuth.js";

export default async function removeFriend(friendId){
	try
    {
        const response = await fetchWithAuth("/api/users/friendship/", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ friend_id: friendId })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to remove friend from friendlist.");
        }

        showToast("Friend successfully removed.", "success");
        loadFriends(); // Refresh the friend list
    } catch (error) {
        showToast(error, "error");
    }
}