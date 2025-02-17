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
					<img id="avatarLoading" src="loading-spinner.gif" alt="Loading..." style="display: none; width: 50px; height: 50px;">
					<img id="avatarPreview" src="default-avatar.png" alt="Avatar Preview" class="img-fluid avatar-small">
					<input type="file" id="avatar" class="form-control mt-2">
				</div>
                <button type="submit" class="btn btn-success w-100">Save Changes</button>
            </form>
            
            <button class="btn btn-secondary w-100 mt-3" id="returnUpdate">Return</button>
        </div>
    `;

	document.getElementById("avatar").addEventListener("change", function(event) {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = function(e) {
				document.getElementById("avatarPreview").src = e.target.result;
			};
			reader.readAsDataURL(file);
		}
	});
	
	const userId = localStorage.getItem("user_id");
	loadUserData(userId);
    document.getElementById("updateProfileForm").addEventListener("submit", handleProfileUpdate);
    document.getElementById("returnUpdate").addEventListener("click", () => navigateTo("/settings"));
}

async function loadUserData(userId) {
    console.log("- start: loadUserData()");    
	const accessToken = localStorage.getItem("access_token");
    
    if (!accessToken) {
        console.error("❌ No access token found.");
        return;
    }

    // Select avatar elements
    const avatarPreview = document.getElementById("avatarPreview");
    const avatarLoading = document.getElementById("avatarLoading");

    // Show loading spinner before fetching data
    avatarPreview.style.display = "none";
    avatarLoading.style.display = "block";

    try {
        const response = await fetch(`/api/users/profile/${userId}/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            },
        });

        if (response.ok) {
            const user = await response.json();

            // Set username and email fields
            document.getElementById("username").value = user.username;
            document.getElementById("email").value = user.email;

            // Set avatar if exists, otherwise use default
            if (user.avatar) {
                avatarPreview.src = user.avatar;
            } else {
                avatarPreview.src = "default-avatar.png";
            }
        } 
		else {
            console.warn("⚠️ Failed to fetch user data. Response:", await response.json());
        }
    } catch (error) {
        console.error("❌ Network error:", error);
    } finally {
        // Hide loading spinner and show avatar
        avatarLoading.style.display = "none";
        avatarPreview.style.display = "block";
    }
}
