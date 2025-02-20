import navigateTo from "../navigation/navigateTo.js";
import { handleDataExport } from "../users/handleDataExport.js";
import handleAccountDeletion from "../users/handleAccountDeletion.js";
import { is_2fa_enabled } from "../users/handleLogin.js";

export default function renderSettings()
{
    const main = document.getElementById("main");

    main.innerHTML = `
        <div class="container" style="padding-top: 50px; max-width: 600px; margin: 0 auto;">
            <h1 class="text-center">Settings</h1>
            <p class="text-muted text-center">Manage your account preferences and security settings below:</p>
            
            <div class="d-flex flex-column gap-2 mt-4">
                <button class="btn btn-dark" id="friendList"><i class="fas fa-user-edit"></i> Friend List</button>
				<button class="btn btn-dark" id="2FA"><i class="fas fa-shield-alt"></i> Two-Factor Authentication</button>
                <button class="btn btn-dark" id="updateInformations"><i class="fas fa-user-edit"></i> Update Informations</button>
                <button class="btn btn-dark" id="downloadData"><i class="fas fa-download"></i> Download Your Data</button>
                <button class="btn btn-dark" id="deleteAccount"><i class="fas fa-trash"></i> Delete Account</button>
            </div>
        </div>
    `;

    if (is_2fa_enabled)
        document.getElementById("2FA").addEventListener("click", () => navigateTo("/2fa-setup"));
    else
        document.getElementById("2FA").addEventListener("click", () => navigateTo("/2fa-remove"));

    document.getElementById("friendList").addEventListener("click", () => navigateTo("/friends"));
    document.getElementById("updateInformations").addEventListener("click", () => navigateTo("/update-informations"));
    document.getElementById("downloadData").addEventListener("click", async () => {await handleDataExport();});    
    document.getElementById("deleteAccount").addEventListener("click", () => handleAccountDeletion());
}
