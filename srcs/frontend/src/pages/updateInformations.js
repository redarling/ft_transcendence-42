import navigateTo from "../navigation/navigateTo.js";
import { handleInformationsUpdate } from "../users/handleInformationsUpdate.js";
import { fetchWithAuth } from "../utils/fetchWithAuth.js";

export default function renderUpdateInformations()
{
    console.log("- function: renderUpdateProfile()");
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
            
            <button class="btn btn-secondary w-100 mt-3" id="returnUpdate">Back</button>
        </div>
    `;
	loadUserData();
    document.getElementById("updateProfileForm").addEventListener("submit", handleInformationsUpdate);
    document.getElementById("returnUpdate").addEventListener("click", async () => await navigateTo("/settings"));
}

async function loadUserData()
{
    console.log("- function: loadUserData()");

    // Select avatar preview elements in my html
    const avatarPreview = document.getElementById("avatarPreview");

    try
    {
        // fetch user datas (email, username, avatar)
		const response = await fetchWithAuth(`/api/users/profile/${localStorage.getItem('user_id')}/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok)
        {
            const user = await response.json();

            // Set username, email fields + display avatar
            document.getElementById("username").value = user.username;
            document.getElementById("email").value = user.email;
			avatarPreview.src = user.avatar;
			avatarPreview.style.display = "block";
        } 
		else
        {
            console.warn("⚠️ Failed to fetch user data. Response:", await response.json());
        }
    } 
	catch (error) {
        console.error("❌ Network error:", error);
    } 
}
