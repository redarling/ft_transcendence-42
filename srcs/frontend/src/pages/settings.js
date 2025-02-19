import navigateTo from "../navigation/navigateTo.js";

export default function renderSettings()
{
    console.log("- start: renderSettings()");
    const main = document.getElementById("main");

    main.innerHTML = `
        <div class="container" style="padding-top: 50px; max-width: 600px; margin: 0 auto;">
            <h1 class="text-center">Settings</h1>
            <p class="text-muted text-center">Manage your account preferences and security settings below:</p>
            
            <div class="d-flex flex-column gap-2 mt-4">
                <button class="btn btn-dark" id="enable2FA"><i class="fas fa-shield-alt"></i> Enable Two-Factor Authentication</button>
                <button class="btn btn-dark" id="disable2FA"><i class="fas fa-user-shield"></i> Disable Two-Factor Authentication</button>
                <button class="btn btn-dark" id="updateInformations"><i class="fas fa-user-edit"></i> Update Informations</button>
                <button class="btn btn-dark" id="downloadData"><i class="fas fa-download"></i> Download Your Data</button>
                <button class="btn btn-dark" id="deleteAccount"><i class="fas fa-trash"></i> Delete Account</button>
            </div>
        </div>
    `;

    // TODO: Show only one 2FA button based on user's current 2FA status
    // TODO: Restrict unauthenticated users from accessing this page
    document.getElementById("enable2FA").addEventListener("click", () => navigateTo("/2fa-setup"));
    document.getElementById("disable2FA").addEventListener("click", () => navigateTo("/2fa-remove"));
    document.getElementById("updateInformations").addEventListener("click", () => navigateTo("/update-informations"));
    document.getElementById("downloadData").addEventListener("click", () => alert("Downloading Data..."));
    document.getElementById("deleteAccount").addEventListener("click", () => confirm("Are you sure you want to delete your account?"));
}
