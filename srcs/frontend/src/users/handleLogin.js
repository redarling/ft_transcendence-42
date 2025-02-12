import navigateTo from "../navigation/navigateTo.js";
import renderHeader from "../components/header.js";
import handleLogout from "./handleLogout.js";
import connectWebSocket from "./websocket.js";

async function updateLoginHeaderToLogout() {
	const loginHeader = document.getElementById("loginHeader");
	loginHeader.outerHTML = `
		<a class="nav-link" id="logoutHeader">Logout</a>
	`;
	document.getElementById("logoutHeader").addEventListener("click", handleLogout);
}

async function loginUser(username, password) {
	const response = await fetch("/api/users/login/", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username, password }),
	});

	if (response.ok) {
		return await response.json();
	} else {
		return null;
	}
}

export default async function handleLogin(event) {
	console.log("- start: handleLogin()");
	event.preventDefault();

	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;

	try {
		const data = await loginUser(username, password);

		if (data) {
			localStorage.setItem("access_token", data.access_token);
			localStorage.setItem("refresh_token", data.refresh_token);
			console.log("updateLoginHeaderToLogout");
			updateLoginHeaderToLogout();
			console.log("websocket");
			connectWebSocket();
			console.log("websocket");
			renderHeader();
			navigateTo("/home");
		} 
		else {
			console.log("The value of data is: ", data);
			console.log("Login error!");
		}
	} catch (error) {
		console.log("Network error. Try again!");
	}
}
