import { handleForgotPassword } from "../users/handleForgotPassword.js";
import navigateTo from "../navigation/navigateTo.js";
import showToast from "../utils/toast.js";
import showLoadingSpinner from "../utils/spinner.js";

export default function renderForgotPassword()
{
    console.log("- start: renderForgotPassword()");

    const main = document.getElementById("main");
    main.innerHTML = `
    <div class="container d-flex justify-content-center align-items-center" style="height: 80vh;">
        <div class="row w-100" style="max-width: 400px;">
            <h1 class="text-center">Forgot Password</h1>
            <p class="text-center text-muted">Enter your email, and we'll send you a password reset link.</p>

            <form id="forgotPasswordForm" class="mt-3">
                <input type="email" id="email" class="form-control mb-2" placeholder="Enter your email" required>

                <div class="d-grid">
                    <button type="submit" id="sendButton" class="btn btn-success">Send Reset Link</button>
                </div>
            </form>

            <div class="d-grid mt-3">
                <button id="back-button" class="btn btn-secondary">Back</button>
            </div>
            
            <p id="statusMessage" class="mt-3 text-center"></p>
        </div>
    </div>
`;


    document.getElementById("forgotPasswordForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("email").value.trim();
        await ForgotPasswordRequest(email);
    });

    document.getElementById("back-button").addEventListener("click", () => {
        navigateTo("/login");
    });
}

async function ForgotPasswordRequest(email)
{    
    try
    {
        showLoadingSpinner(true);

        const response = await fetch("/api/users/forgot-password/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });

        const result = await response.json();

        if (response.ok)
        {
            showLoadingSpinner(false);
            handleForgotPassword(email);
        }
        else
            showToast(result.error || result.detail || "Unknown error. Please, try again.", "error");
    }
    catch (error)
    {
        showToast("An error occurred. Please try again.", "error");
    }
    finally
    {
        showLoadingSpinner(false);
    }
}
