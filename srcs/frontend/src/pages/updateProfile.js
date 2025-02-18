import navigateTo from "../navigation/navigateTo.js";
import { handleProfileUpdate } from "../users/handleProfileUpdate.js";

export default function renderUpdateProfile() {
    console.log("- start: renderUpdateProfile()");
    const main = document.getElementById("main");

    main.innerHTML = `
		<div class="container mb-5" style="padding-top: 25px; max-width: 600px; margin: 0 auto;">
            <h1 class="text-center">Update Profile</h1>
            <p class="text-muted text-center">Modify your account information below:</p>
            
            <form id="updateProfileForm" class="mt-4">
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" id="username" class="form-control" placeholder="Enter new username" required>
                </div>
                
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" id="email" class="form-control" placeholder="Enter new email" required>
                </div>

                <div class="mb-3">
                    <label for="password" class="form-label">New Password</label>
                    <input type="password" id="password" class="form-control" placeholder="Enter new password only if you want to modify it">
                </div>

				<div class="mb-3">
					<label for="avatar" class="form-label">Avatar</label>
					<img id="avatarPreview" src="default-avatar.png" alt="Avatar Preview" class="img-fluid avatar-small">
					<input type="url" id="avatar" class="form-control" placeholder="Enter Imgur URL of new avatar"
						pattern="https:\/\/i\.imgur\.com\/[a-zA-Z0-9]+\.(jpeg|jpg|gif|png)" 
						title="Please enter a valid Imgur image URL (e.g., https://i.imgur.com/xyz123.png)">
				</div>
                <button type="submit" class="btn btn-success w-100">Save Changes</button>
            </form>
            
            <button class="btn btn-secondary w-100 mt-3" id="returnUpdate">Return</button>
        </div>
    `;
	loadUserData();
    document.getElementById("updateProfileForm").addEventListener("submit", handleProfileUpdate);
    document.getElementById("returnUpdate").addEventListener("click", () => navigateTo("/settings"));
}

async function loadUserData() {
    console.log("- start: loadUserData()");

	// Get userId
	const userId = localStorage.getItem("user_id");
	if (!userId){
        console.error("❌ No userID found.");
		return;
	}

	// Get access token to fetch user data
	const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        console.error("❌ No access token found.");
        return;
    }

    // Select avatar preview elements in my html
    const avatarPreview = document.getElementById("avatarPreview");

    try {
        // fetch user datas (email, username, avatar)
		const response = await fetch(`/api/users/profile/${userId}/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            },
        });

        if (response.ok) {
            const user = await response.json();

            // Set username, email fields + display avatar
            document.getElementById("username").value = user.username;
            document.getElementById("email").value = user.email;
			avatarPreview.src = user.avatar;
			avatarPreview.style.display = "block";
        } 
		else {
            console.warn("⚠️ Failed to fetch user data. Response:", await response.json());
        }
    } 
	catch (error) {
        console.error("❌ Network error:", error);
    } 
}
