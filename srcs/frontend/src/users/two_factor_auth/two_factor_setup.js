import showToast from "../../utils/toast.js";
import showLoadingSpinner from "../../utils/spinner.js";
import { renderTOTPPage, renderWaitingCodePage } from "./setup_pages.js";
import navigateTo from "../../navigation/navigateTo.js";
import { fetchWithAuth } from "../../utils/fetchWithAuth.js";

export default async function TwoFASetup()
{
    const main = document.getElementById("main");
    let selectedType = null;

    main.innerHTML = `
        <div class="container" style="padding-top: 50px; max-width: 600px; margin: 0 auto;">
            <h1 class="text-center">Two-Factor Authentication Setup</h1>
            <p class="text-muted text-center">Enhance your account security by enabling two-factor authentication (2FA). Choose your preferred method below:</p>
            
            <div class="d-flex flex-column gap-2 mt-4">
                <button class="btn btn-dark twofa-option" data-type="sms">SMS (Telegram Bot)</button>
                <button class="btn btn-dark twofa-option" data-type="email">Email</button>
                <button class="btn btn-dark twofa-option" data-type="totp">Authenticator App</button>
            </div>
            
            <div id="twofa-details" class="mt-4"></div>
            
            <button id="next-button" class="btn btn-success w-100 mt-3" disabled>Next</button>
            <button id="back-button" class="btn btn-secondary w-100 mt-3 mb-5">Back</button>
        </div>
    `;
    
    const nextButton = document.getElementById("next-button");
    const backButton = document.getElementById("back-button");

    document.querySelectorAll(".twofa-option").forEach(button => {
        button.addEventListener("click", () => {
            const type = button.getAttribute("data-type");
            selectedType = type;
            renderDetails(selectedType);
            nextButton.disabled = false;
        });
    });

    nextButton.addEventListener("click", async () => { 
        await handleTwoFASetup(createPayload(selectedType));
    });

    backButton.addEventListener("click", () => {
        navigateTo("/settings");
    });
}

function renderDetails(type)
{
    const detailsContainer = document.getElementById("twofa-details");

    if (type === "sms")
    {
        detailsContainer.innerHTML = `
            <h2 class="text-center">SMS Authentication via Telegram</h2>
            <p>To receive authentication codes via Telegram, follow these steps:</p>
            <ol>
                <li>Open the bot: <a href="https://t.me/transcendence_pong_bot" target="_blank">@transcendence_pong_bot</a></li>
                <li>Start a chat with the bot</li>
                <li>Copy your chat ID and enter it below:</li>
            </ol>
            <input type="text" id="chat-id" class="form-control" placeholder="Enter your chat ID (digits only)" maxlength="32" pattern="\\d*">
        `;
        
        const chatIdInput = document.getElementById("chat-id");
        chatIdInput.addEventListener("input", () => {
            chatIdInput.value = chatIdInput.value.replace(/\D/g, "").slice(0, 32);
        });
    }
    else if (type === "email")
    {
        detailsContainer.innerHTML = `
            <h2 class="text-center">Email Authentication</h2>
            <p>We will send a one-time code to your registered email address every time you log in.</p>
        `;
    }
    else if (type === "totp")
    {
        detailsContainer.innerHTML = `
            <h2 class="text-center">Authenticator App (TOTP)</h2>
            <p>Use an authenticator app (such as Google Authenticator or Authy) to scan the QR code and generate login codes.</p>
        `;
    }
}

function createPayload(type)
{
    if (type === "sms")
    {
        const chatId = document.getElementById("chat-id")?.value.trim();
        return { method: type, chat_id: chatId };
    }
    else if (type === "email" || type === "totp")
        return { method: type };
    return null;
}

async function handleTwoFASetup(payload)
{    
    if (!payload)
    {
        showToast("Invalid 2FA setup method.", "error");
        return;
    }

    if (payload.method === "sms" && !payload.chat_id)
    {
        showToast("Chat ID field can't be empty.", "error");
        return;
    }

    try
    {
        showLoadingSpinner(true);

        const url = `/api/users/2fa/setup/`;
        const response = await fetchWithAuth(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok)
        {
            if (payload.method === "sms")
            {
                showLoadingSpinner(false);
                renderWaitingCodePage("Telegram");
            }
            else if (payload.method === "email")
            {
                showLoadingSpinner(false);
                renderWaitingCodePage("email");
            }
            else
                renderTOTPPage(result.qr_code, result.uri);
        }
        else
        {
            const errorMsg = result.error || result.detail || "Sorry! An error occurred while setting up 2FA.";
            showToast(errorMsg, "error");
        }
    }
    catch (error)
    {
        console.error("Network error during 2FA setup:", error);
        showToast("An error occurred during the 2FA setup. Please try again later.", "error");
    }
    finally
    {
        showLoadingSpinner(false);
    }
}
