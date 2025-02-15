import { showToast } from "../../tournament_gaming/utils.js";
import showLoadingSpinner from "./utils.js";
import navigateTo from "../../navigation/navigateTo.js";

export default async function TwoFARemove()
{
    let  token = prompt("Please enter your JWT token:", "");
    const main = document.getElementById("main");

    main.innerHTML = `
        <div class="container" style="padding-top: 50px; max-width: 600px; margin: 0 auto;">
            <h1 class="text-center">Two-Factor Authentication Remove</h1>
            <p class="text-muted text-center">Your account security by disabling two-factor authentication (2FA) will be at <strong>risk</strong>!</p>
            <p class="text-muted text-center">If you are sure, press the button below and we will send you a code to verify your request.</p>
            
            <button id="remove-button" class="btn btn-danger w-100 mt-3" >Remove</button>
        </div>
    `;
    
    const removeButton = document.getElementById("remove-button");

    removeButton.addEventListener("click", async () => { 
        await handleTwoFARemove(token);
    });
}

async function handleTwoFARemove(token)
{
    //const token = localStorage.getItem("access_token");
    try
    {
        showLoadingSpinner(true);

        const response = await fetch("/api/users/2fa/remove/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        const result = await response.json();

        if (response.ok)
        {
            showLoadingSpinner(false);
            if (result.method == "sms")
                renderWaitingCodePage("Telegram");
            else if (result.method == "email")
                renderWaitingCodePage("Email");
            else
                renderWaitingCodePage("Authenticator App");
        }
        else
            showToast(result.error || result.detail || "Sorry! An error occurred while removing 2FA.", "error");
    }
    catch (error)
    {
        console.error("Error:", error);
        showToast("Sorry! An error occurred while removing 2FA.", "error");
    }
    finally
    {
        showLoadingSpinner(false);
    }
}

export async function renderWaitingCodePage(method)
{
    const token = prompt("Please enter your JWT token:", "");

    const main = document.getElementById("main");
    main.innerHTML = `
        <div class="container" style="padding-top: 50px; max-width: 600px; margin: 0 auto;">

            <div class="alert alert-info text-center">
                📩 Please, enter your verification code from <b>${method}</b>.
            </div>

            <h1 class="text-center">Verify Your Two-Factor Authentication Disable</h1>
            <p class="text-muted text-center">Enter the 6-digit verification code you received.</p>

            <div class="d-flex justify-content-center mt-3" id="code-container">
                ${Array(6).fill(0).map((_, i) => `
                    <input type="text" class="code-input form-control text-center"
                        maxlength="1" data-index="${i}"
                        style="width: 50px; height: 50px; font-size: 1.5rem; font-weight: bold; text-align: center; margin: 0 5px;"/>
                `).join("")}
            </div>

            <div class="text-center mt-3">
                <button id="submit-button" class="btn btn-danger w-100" disabled>Submit</button>
                <button id="back-button" class="btn btn-secondary w-100 mt-2">Back</button>
            </div>

            <div class="text-center mt-3 d-none" id="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Verifying...</span>
                </div>
                <p class="text-muted mt-2">Verifying your code, please wait...</p>
            </div>

            <p class="text-muted text-center mt-4">
                * The verification code is valid for <b>limited time</b>.
            </p>
            <p class="text-muted text-center">* Your 2FA disable will be completed upon successful verification.</p>

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
        TwoFARemove();
    });

    inputs[0].focus();
}

async function handleVerificationCode(verificationCode, token)
{
    //const token = localStorage.getItem("access_token");
    
    try
    {
        showLoadingSpinner(true);

        const response = await fetch("/api/users/2fa/verify-remove/", {
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
            showToast("2FA disabled successfuly!", "success");
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