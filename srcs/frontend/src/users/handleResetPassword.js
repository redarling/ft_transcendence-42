import navigateTo from "../navigation/navigateTo.js";
import showToast from "../utils/toast.js";
import showLoadingSpinner from "../utils/spinner.js";

export async function handleResetPassword(challenge)
{
    console.log("- start: handleResetPassword()");
    const main = document.getElementById("main");

    main.innerHTML = `
    <div class="container d-flex justify-content-center align-items-center" style="height: 80vh;">
        <div class="row w-100" style="max-width: 400px;">
            <h1 class="text-center">Reset Password</h1>

            <form id="resetForm" class="mt-3">
                <div class="input-group mb-2">
                    <input type="password" id="password" class="form-control" placeholder="New Password" required>
                    <button class="btn btn-outline-secondary toggle-password" type="button" data-target="password">Show</button>
                </div>

                <div class="input-group mb-2">
                    <input type="password" id="confirmPassword" class="form-control" placeholder="Confirm Password" required>
                    <button class="btn btn-outline-secondary toggle-password" type="button" data-target="confirmPassword">Show</button>
                </div>

                <p id="error-message" class="text-danger text-center" style="display: none;">Passwords do not match</p>

                <div class="d-flex gap-2">
                    <button id="back-button" class="btn btn-secondary flex-grow-1">Back</button>
                    <button type="submit" id="submit-button" class="btn btn-success flex-grow-1" disabled>Submit</button>
                </div>
            </form>
        </div>
    </div>
    `;

    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const submitButton = document.getElementById("submit-button");
    const errorMessage = document.getElementById("error-message");

    function validatePasswords()
    {
        if (passwordInput.value.trim() !== "" && confirmPasswordInput.value.trim() !== "")
        {
            if (passwordInput.value === confirmPasswordInput.value)
            {
                submitButton.removeAttribute("disabled");
                errorMessage.style.display = "none";
            }
            else
            {
                submitButton.setAttribute("disabled", "true");
                errorMessage.style.display = "block";
            }
        }
        else
        {
            submitButton.setAttribute("disabled", "true");
            errorMessage.style.display = "none";
        }
    }

    passwordInput.addEventListener("input", validatePasswords);
    confirmPasswordInput.addEventListener("input", validatePasswords);

    document.querySelectorAll(".toggle-password").forEach(button => {
        button.addEventListener("click", () => {
            const target = document.getElementById(button.getAttribute("data-target"));
            target.type = target.type === "password" ? "text" : "password";
            button.textContent = target.type === "password" ? "Show" : "Hide";
        });
    });

    document.getElementById("back-button").addEventListener("click", async () => await navigateTo("/login"));

    document.getElementById("resetForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const password = passwordInput.value.trim();
        await fetchResetPassword(challenge, password);
    });
}

async function fetchResetPassword(challenge, password)
{
    try
    {
        showLoadingSpinner(true);

        const response = await fetch("/api/users/reset-password/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ challenge_token: challenge, new_password: password })
        });

        const result = await response.json();

        if (response.ok)
        {
            showLoadingSpinner(false);
            await navigateTo("/login");
            showToast("Password reset successfully. Please, login.", "success");
        }
        else
            showToast(result.error || result.detail || "Unknown error. Please, try again.", "error");
    }
    catch (error)
    {
        showToast("An error occurred. Please, try again.", "error");
    }
    finally
    {
        showLoadingSpinner(false);
    }
}
