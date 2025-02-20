import navigateTo from "../navigation/navigateTo.js";
import showToast from "../utils/toast.js";
import showLoadingSpinner from "../utils/spinner.js";
import { clearUserData } from "./handleLogout.js";

export default function handleAccountDeletion()
{
    const main = document.getElementById("main");
    main.innerHTML = `
        <div class="container" style="padding-top: 50px; max-width: 600px; margin: 0 auto;">
            <h1 class="text-center">Account Deletion</h1>
            <p class="text-muted text-center">Your account will be permanently deleted.</p>
            <p class="text-muted text-center">All your data will be lost forever.</p>
            <p class="text-muted text-center"><strong>This action is irreversible!</strong></p>
            <p class="text-muted text-center">If you are sure, type 'confirm' in the input field below and press the delete button.</p>
            <input id="confirm-input" class="form-control mt-3" type="text" placeholder="Type 'confirm' here">
            
            <button id="delete-button" class="btn btn-danger w-100 mt-3" disabled>Delete</button>
            <button id="back-button" class="btn btn-secondary w-100 mt-3 mb-5">Back</button>
        </div>
    `;

    const confirmInput = document.getElementById("confirm-input");
    const deleteButton = document.getElementById("delete-button");

    confirmInput.addEventListener("input", () => {
        deleteButton.disabled = confirmInput.value.trim().toLowerCase() !== "confirm";
    });

    document.getElementById("back-button").addEventListener("click", () => {
        navigateTo("/settings");
    });

    deleteButton.addEventListener("click", async () => {
        //await fetchAccountDeletion();
        console.log("Account deletion is disabled in the frontend.");
    });
}

async function fetchAccountDeletion()
{
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken)
    {
        navigateTo("/home");
        showToast("An error occurred. Please, try again.", "error");
        return;
    }
    try
    {
        showLoadingSpinner(true);

        const response = await fetch("/api/users/delete-account/", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const result = await response.json();

        if (response.ok)
        {
            showToast("Account deleted successfully.", "success");
        }
        else
            showToast(result.error || result.detail || "Unknown error. Please, try again.", "error");

    }
    catch (error)
    {
        navigateTo("/home");
        showToast("An error occurred. Please, try again.", "error");
    }
    finally
    {
        showLoadingSpinner(false);
    }
}
