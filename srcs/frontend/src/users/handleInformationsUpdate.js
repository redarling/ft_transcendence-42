import { fetchWithAuth } from "../utils/fetchWithAuth.js";
import showToast from "../utils/toast.js"

export async function handleInformationsUpdate(event)
{
    console.log("- function: handleProfileUpdate()");
	
	// Prevent form reload
    event.preventDefault();

    // 🔹 Get form values
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const avatarInput = document.getElementById("avatar");
    const avatarUrl = avatarInput.value;

    // 🔹 Check if the URL is an actual image on Imgur
    if (avatarUrl) {
        const isValidImage = await checkImageExists(avatarUrl);
        if (!isValidImage) {
            showToast("The provided Imgur URL is not a valid image. Please enter a correct direct Imgur image URL.", "error");
            return;
        }
    }

    // 🔹 Build FormData for file upload
    const formData = new FormData();
    if (username) formData.append("username", username);
    if (email) formData.append("email", email);
    if (password) formData.append("password", password);
    if (avatarUrl) formData.append("avatar", avatarUrl);

    console.log("🛠️ FormData content:");
    for (const pair of formData.entries()) {
        console.log(`   ${pair[0]}:`, pair[1]);
    }

    try {
        console.log("📤 Sending update request...");

        const response = await fetchWithAuth("/api/users/update/", {
            method: "PATCH",
            body: formData,
        });

        if (!response.ok) {
            console.warn("⚠️ Failed to update profile:", response.status);
            showToast(" Update failed. Please try again.", "error");
            return;
        }

        // 🔹 Update frontend state with new user data
        const updatedUser = await response.json();
        console.log("✅ Profile updated successfully:", updatedUser);

        // Update avatar preview if changed
        updateAvatarPreview(avatarUrl);
        showToast("Profile updated successfully!", "success");
    } 
    catch (error) {
        console.error("❌ Error updating profile:", error);
    }
}

function updateAvatarPreview(avatarUrl) {
    if (avatarUrl) {
        const avatarPreview = document.getElementById("avatarPreview");
        avatarPreview.src = avatarUrl;
        document.getElementById("avatar").value = ""; // Clear input field
    }
}

async function checkImageExists(url) {
    try {
        const response = await fetch(url, { method: "HEAD" });

        // Check if the response is OK and contains a valid image MIME type
        const contentType = response.headers.get("Content-Type");
        return response.ok && contentType && contentType.startsWith("image/");
    } 
	catch (error) {
        console.error("❌ Error checking image:", error);
        return false;
    }
}