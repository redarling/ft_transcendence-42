import navigateTo from "../navigation/navigateTo.js"
import showToast from "../utils/toast.js";
import showLoadingSpinner from "../utils/spinner.js";

export default async function handleRegister(event)
{
	console.log("- function: handleRegister()")
	event.preventDefault();

	const username = document.getElementById("username").value;
	const email = document.getElementById("email").value;
	const password = document.getElementById("password").value;
	
	try
	{
		showLoadingSpinner(true);
		const response = await fetch('/api/users/register/', {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, email, password }),
		});

		const result = await response.json();

		if (response.ok)
		{
			console.log("Registration successful:", result);
			await navigateTo('/login');
			showToast(result.message, "success");
		}
		else if (result.error || result.detail)
			showToast(result.error, "error");
		else if (typeof result === "object")
		{
			const errorMessage = Object.values(result).flat().join("\n")
			showToast(errorMessage, "error");
		}
		else
			showToast("An unknown error occurred.", "error");
	} 
	catch (error)
	{
		showToast("Network error. Try again!", "error");
		console.error("Registration error:", error);
	}
	finally
	{
		showLoadingSpinner(false);
	}
}

