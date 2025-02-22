import navigateTo from "../navigation/navigateTo.js";
import { handleDataExport } from "../users/handleDataExport.js";
import handleAccountDeletion from "../users/handleAccountDeletion.js";
import showLoadingSpinner from "../utils/spinner.js";
import { fetchWithAuth } from "../utils/fetchWithAuth.js";

export default async function renderSettings()
{
    const main = document.getElementById("main");

    const is_2fa_enabled = await is2FAenabled();

    main.innerHTML = `
        <div class="container" style="padding-top: 50px; max-width: 600px; margin: 0 auto;">
            <h1 class="text-center">Settings</h1>
            <p class="text-muted text-center">Manage your account preferences and security settings below:</p>

            <div class="d-flex flex-column gap-2 mt-4">
				<button class="btn btn-dark" id="2FA"><i class="fas fa-shield-alt"></i> Two-Factor Authentication</button>
                <button class="btn btn-dark" id="updateInformations"><i class="fas fa-user-edit"></i> Update Informations</button>
                <button class="btn btn-dark" id="downloadData"><i class="fas fa-download"></i> Download Your Data</button>
                <button class="btn btn-dark" id="deleteAccount"><i class="fas fa-trash"></i> Delete Account</button>
            </div>
        </div>
    `;

    if (!is_2fa_enabled)
        document.getElementById("2FA").addEventListener("click", async () => await navigateTo("/2fa-setup"));
    else
        document.getElementById("2FA").addEventListener("click", async () => await navigateTo("/2fa-remove"));

    document.getElementById("updateInformations").addEventListener("click", async () => await navigateTo("/update-informations"));
    document.getElementById("downloadData").addEventListener("click", async () => {await handleDataExport();});    
    document.getElementById("deleteAccount").addEventListener("click", () => handleAccountDeletion());
}

async function is2FAenabled()
{
    try
    {
        showLoadingSpinner(true);

        const response = await fetchWithAuth("/api/users/is-2fa-enabled/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const result = await response.json();
        
        if (response.ok)
        {
            showLoadingSpinner(false);
            return result.is_2fa_enabled;
        }
        else
            throw new Error(result.error || result.detail || "An unknown error occurred");
    }
    catch (error)
    {
        console.error(error);
        return false;
    }
    finally
    {
        showLoadingSpinner(false);
    }
}
