import navigateTo from "../navigation/navigateTo.js";
import renderHeader from "../components/header.js";
import connectWebSocket from "./websocket.js";
import showToast from "../utils/toast.js";
import showLoadingSpinner from "../utils/spinner.js";
import { startTokenRefreshing } from "./tokenRefreshing.js";
import { getUserId } from "./getUserId.js";

async function loginUser(username, password)
{
	try
	{
		showLoadingSpinner(true);
		const response = await fetch("/api/users/login/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});
	
		const result = await response.json();
		
		if (response.ok)
			return result;
		else
		{
			showToast(result.error || "An unknown error occurred.", "error");
			return null;
		}
	}
	catch (error)
	{
		showToast("Network error. Try again!", "error");
		return null;
	}
	finally
	{
		showLoadingSpinner(false);
	}
}

export default async function handleLogin(event)
{
	console.log("- function: handleLogin()");
	event.preventDefault();

	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;

	let data = await loginUser(username, password);

	if (!data)
		return

	if (data.challenge_token)
	{
		const challengeToken = data.challenge_token;
		render2FAForm(challengeToken);
	}
	else
	{
		handleSuccessfulLogIn(data);
	} 
}

async function render2FAForm(challengeToken)
{
	const main = document.getElementById("main");
	main.innerHTML = `
		<div class="container" style="padding-top: 50px; max-width: 600px; margin: 0 auto;">

			<div class="alert alert-info text-center">
				📩 We have sent you a verification code.
			</div>

			<h1 class="text-center">Two-Factor Authentication Verification</h1>
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
		await handleVerificationCode(challengeToken, verificationCode);
	});

	backButton.addEventListener("click", () => {
		navigateTo("/login");
	});

	inputs[0].focus();
}

async function handleVerificationCode(challengeToken, verificationCode)
{	
	try
	{
		showLoadingSpinner(true);

		const response = await fetch("/api/users/login/with-2fa/", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ challenge: challengeToken, code: verificationCode })
		});

		const result = await response.json();

		if (response.ok)
			handleSuccessfulLogIn(result);
		else
			showToast(result.error || result.detail || "Error occurred. Please try again later.", "error");
	}
	catch (error)
	{
		console.error("Verification error:", error);
		showToast("An error occurred while verifying the code. Please try again later.", "error");
	}
	finally
	{
		showLoadingSpinner(false);
	}
}

function handleSuccessfulLogIn(data)
{
	localStorage.setItem("access_token", data.access_token);
	console.log("Access token: ", data.access_token);
	localStorage.setItem("refresh_token", data.refresh_token);
	localStorage.setItem("user_id", getUserId())
	connectWebSocket();
	startTokenRefreshing();
	renderHeader();
	navigateTo("/home");
	console.log("- end: handleLogin()");
}