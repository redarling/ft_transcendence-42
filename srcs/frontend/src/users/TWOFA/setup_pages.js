import { showToast } from "../../tournament_gaming/utils.js";
import showLoadingSpinner from "./utils.js";
import navigateTo from "../../navigation/navigateTo.js";
import TwoFASetup from "./TwoFa_setup.js";

export function renderTOTPPage(qr_code, uri)
{
    const main = document.getElementById("main");
    main.innerHTML = `
        <div class="container" style="padding-top: 50px; max-width: 600px; margin: 0 auto;">
            
            <div class="alert alert-success text-center">
                ✅ Two-Factor Authentication (TOTP) successfully enabled!
            </div>

            <h1 class="text-center">Authenticator App Setup</h1>
            <p class="text-muted text-center">Follow these steps to complete the setup:</p>
            
            <ol class="text-muted">
                <li>Open your authenticator app (Google Authenticator, Authy, etc.).</li>
                <li>Scan the QR code below or manually enter the key.</li>
                <li>After setup, use the app to generate login codes.</li>
            </ol>

            <div class="text-center mt-4">
                <img src="data:image/png;base64,${qr_code}" alt="QR Code" class="border rounded shadow-sm" style="max-width: 250px;" />
            </div>

            <p class="text-center mt-3"><b>Or use this key manually:</b></p>

            <div class="input-group">
                <input type="text" id="totp-uri" class="form-control text-center" value="${uri}" readonly style="cursor: pointer; font-weight: bold;">
                <button id="copy-uri" class="btn btn-outline-secondary" style="color: black;">Copy</button>
            </div>

            <p class="text-muted text-center mt-2">Click the key to copy it automatically.</p>

            <button id="home-button" class="btn btn-primary w-100 mt-4 mb-4">Home</button>
        </div>
    `;

    const uriInput = document.getElementById("totp-uri");
    uriInput.addEventListener("click", () => {
        navigator.clipboard.writeText(uri);
        showToast("Copied to clipboard!", "success");
    });

    const copyButton = document.getElementById("copy-uri");
    copyButton.addEventListener("click", () => {
        navigator.clipboard.writeText(uri);
        showToast("Copied to clipboard!", "success");
    });

    document.getElementById("home-button").addEventListener("click", () => {
        renderHome();
    });
}

export async function renderWaitingCodePage(method)
{
    const token = prompt("Please enter your JWT token:", "");

    const main = document.getElementById("main");
    main.innerHTML = `
        <div class="container" style="padding-top: 50px; max-width: 600px; margin: 0 auto;">

            <div class="alert alert-info text-center">
                📩 A verification code has been sent to your <b>${method}</b>.
            </div>

            <h1 class="text-center">Verify Your Two-Factor Authentication</h1>
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
            <p class="text-muted text-center">* Your 2FA setup will be completed upon successful verification.</p>

        </div>
    `;

    const inputs = document.querySelectorAll(".code-input");
    const submitButton = document.getElementById("submit-button");
    const backButton = document.getElementById("back-button");

    inputs.forEach((input, index) => {
        input.addEventListener("input", (e) => {
            const value = e.target.value.replace(/\D/g, "");
            e.target.value = value;

            if (value && index < 5) {
                inputs[index + 1].focus();
            }

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
        await handleVerificationCode(verificationCode, token);
    });

    backButton.addEventListener("click", () => {
        TwoFASetup();
    });

    inputs[0].focus();
}

async function handleVerificationCode(verificationCode, token)
{
    //const token = localStorage.getItem("access_token");
    
    try
    {
        showLoadingSpinner(true);

        const response = await fetch("/api/users/2fa/verify/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ code: verificationCode })
        });

        const result = await response.json();

        if (response.ok)
        {
            showToast("2FA setup successful!", "success");
            navigateTo("/home");
        }
        else
            showToast(result.error || result.detail || "Verification failed. Please try again.", "error");
    }
    catch (error)
    {
        console.error("Verification error:", error);
        showToast("An error occurred while verifying the code. Please try again.", "error");
    }
    finally
    {
        showLoadingSpinner(false);
    }
}

