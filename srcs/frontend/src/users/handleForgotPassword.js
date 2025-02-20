import navigateTo from "../navigation/navigateTo.js";
import showToast from "../utils/toast.js";
import showLoadingSpinner from "../utils/spinner.js";
import { handleResetPassword } from "./handleResetPassword.js";

export async function handleForgotPassword(email)
{
    console.log("- start: handleForgotPassword()");
    const main = document.getElementById("main");
    main.innerHTML = `
        <div class="container" style="padding-top: 50px; max-width: 600px; margin: 0 auto;">

            <div class="alert alert-info text-center">
                📩 We sent the code to your email.
            </div>

            <h1 class="text-center">Reset Password</h1>
            <p class="text-muted text-center">Enter the 6-digit verification code you received.</p>

            <div class="d-flex justify-content-center mt-3" id="code-container">
                ${Array(6).fill(0).map((_, i) => `
                    <input type="text" class="code-input form-control text-center"
                        maxlength="1" data-index="${i}"
                        style="width: 50px; height: 50px; font-size: 1.5rem; font-weight: bold; text-align: center; margin: 0 5px;"/>
                `).join("")}
            </div>

            <div class="text-center mt-3">
                <button id="submit-button" class="btn btn-success w-100" disabled>Submit</button>
                <button id="back-button" class="btn btn-secondary w-100 mt-2">Back</button>
            </div>

            <div class="text-center mt-3 d-none" id="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Verifying...</span>
                </div>
                <p class="text-muted mt-2">Verifying your code, please wait...</p>
            </div>

            <p class="text-muted text-center mt-4">
                * The verification code is valid for <b>15 minutes</b>.
            </p>

        </div>
    `;

    const inputs = document.querySelectorAll(".code-input");
    const submitButton = document.getElementById("submit-button");
    const backButton = document.getElementById("back-button");

    inputs.forEach((input, index) => {
        input.addEventListener("input", (e) => {
            const value = e.target.value.replace(/\D/g, "");
            e.target.value = value;

            if (value && value.length === 1 && index < 5)
                inputs[index + 1].focus();

            checkCodeCompletion();
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && !input.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });

    function checkCodeCompletion()
    {
        const code = Array.from(inputs).map(input => input.value).join("");
        submitButton.disabled = code.length !== 6;
    }

    submitButton.addEventListener("click", async () => {
        const verificationCode = Array.from(inputs).map(input => input.value).join("");
        await fetchForgotPassword(email, verificationCode);
    });

    backButton.addEventListener("click", () => {
        navigateTo("/login");
    });

    inputs[0].focus();
}

async function fetchForgotPassword(email, code)
{
    try
    {
        showLoadingSpinner(true);

        const response = await fetch("/api/users/verify-reset-code/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: code, email: email })
        });

        const result = await response.json();

        if (response.ok)
        {
            showLoadingSpinner(false);
            handleResetPassword(result.challenge_token);
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