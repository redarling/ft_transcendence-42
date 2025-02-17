export async function handleProfileUpdate(event) {
    event.preventDefault(); // Prevent form submission from reloading the page
    console.log("- start: handleProfileUpdate()");

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        console.error("❌ No access token found. User must be authenticated.");
        return;
    }

    // 🔹 Get form values
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const avatarInput = document.getElementById("avatar");
    const avatarFile = avatarInput.files.length > 0 ? avatarInput.files[0] : null;

    // 🔹 Debug: Print avatar file details
    if (avatarFile) {
        console.log(`🖼️ Avatar selected: ${avatarFile.name} (type: ${avatarFile.type}, size: ${avatarFile.size} bytes)`);
    } else {
        console.log("🚫 No new avatar selected.");
    }

    // 🔹 Build FormData for file upload
    const formData = new FormData();
    if (username) formData.append("username", username);
    if (email) formData.append("email", email);
    if (password) formData.append("password", password);
    if (avatarFile) formData.append("avatar", avatarFile); // Append file if selected

    // 🔹 Check FormData contents before sending
    console.log("🛠️ FormData content:");
    for (const pair of formData.entries()) {
        console.log(`   ${pair[0]}:`, pair[1]); // This will print the avatar filename but not the actual file contents
    }

    // 🔹 Stop if no values were added
    if ([...formData.entries()].length === 0) {
        console.warn("⚠️ No changes detected.");
        alert("No updates were made.");
        return;
    }

    try {
        console.log("📤 Sending update request...");

        const response = await fetch("/api/users/update/", {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
            body: formData, // Send as multipart/form-data to support file upload
        });

        if (!response.ok) {
            console.warn("⚠️ Failed to update profile:", response.status);
            alert("❌ Update failed. Please try again.");
            return;
        }

        // 🔹 Update frontend state with new user data
        const updatedUser = await response.json();
        console.log("✅ Profile updated successfully:", updatedUser);

        // Update the UI with new username & avatar
        document.getElementById("username").value = updatedUser.username;
        document.getElementById("avatarPreview").src = updatedUser.avatar;

        alert("✅ Profile updated successfully!");
    } 
	catch (error) {
        console.error("❌ Error updating profile:", error);
        alert("Network error. Please try again.");
    }
}
