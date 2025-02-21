import navigateTo from "../navigation/navigateTo.js";
import showToast from "../utils/toast.js";
import showLoadingSpinner from "../utils/spinner.js";
import { fetchWithAuth } from "../utils/fetchWithAuth.js";

export async function handleDataExport()
{
    try
    {
        showLoadingSpinner(true);

        const response = await fetchWithAuth("/api/users/data-export/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        if (response.ok) {
            showLoadingSpinner(false);

            // Data conversion to JSON string
            const jsonString = JSON.stringify(result, null, 2);
            // Blob object creation
            const blob = new Blob([jsonString], { type: "application/json" });
            // URL for the object
            const url = window.URL.createObjectURL(blob);
            // Download the file
            const a = document.createElement("a");
            a.href = url;
            a.download = "user_data.json";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
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