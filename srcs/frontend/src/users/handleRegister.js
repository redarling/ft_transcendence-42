import navigateTo from "../navigation/navigateTo.js"

export default async function handleRegister(event) {
	console.log("- start: handleRegister()")
	event.preventDefault();

	const username = document.getElementById("username").value;
	const email = document.getElementById("email").value;
	const password = document.getElementById("password").value;
	
	try {
		const response = await fetch('/api/users/register/', {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, email, password }),
		});

		if (response.ok) {
			navigateTo('/login');
		} 
		else {
			alert("Error: Username or email already taken.");
		}
	} 
	catch (error) {
		alert("Network error. Try again!");
	}
}
