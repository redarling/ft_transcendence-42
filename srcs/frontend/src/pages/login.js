import navigateTo from "../navigation/navigateTo.js"
import handleLogout from "../users/logout.js"
import connectWebSocket from "../users/websocket.js";
import renderHeader from "../components/header.js";

async function updateLoginHeaderToLogout()
{
	const loginHeader = document.getElementById("loginHeader");
	loginHeader.outerHTML = `
		<a class="nav-link" id="logoutHeader">Logout</a>
	`
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
	} 
	else {
		return null;
	}
}

async function handleLogin(event) {
	console.log("- start: handleLogin()")
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
            console.log("Login error!");
        }
    } 
	catch (error) {
        console.log("Network error. Try again!");
    }
}

export default function renderLogin() {
	console.log("- start: renderLogin()")
    const main = document.getElementById("main");
    main.innerHTML = `
        <div class="container d-flex justify-content-center align-items-center">
            <div class="row">
            <h1>Login</h1>
            <form id="loginForm" class="mt-3">
                <input type="text" id="username" class="form-control mb-2" placeholder="Username" required>
                <input type="password" id="password" class="form-control mb-2" placeholder="Password" required>
                <button type="submit" class="btn btn-success w-100">Login</button>
            </form>
            <p class="mt-3">
				<a id="goToRegister" class="link-like" style="color: grey; cursor: pointer;">Not registered?</a>
            </p>
		</div>
	`;

    document.getElementById("goToRegister").addEventListener("click", () => navigateTo("/register"));
    document.getElementById("loginForm").addEventListener("submit", handleLogin);
}
