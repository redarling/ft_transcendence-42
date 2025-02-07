import navigateTo from "../main.js"

async function updateLoginHeader()
{
	const loginHeader = getElementById("loginHeader");
	loginHeader.outerHTML = `
		<a class="nav-link" id="logoutHeader">Logout</a>
	`
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
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
		const data = await loginUser(username, password);

        if (data) {
			localStorage.setItem("access_token", data.access_token);
			localStorage.setItem("refresh_token", data.refresh_token);
			updateLoginHeader();
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
    const main = document.getElementById("main");
    main.innerHTML = `
        <div class="d-flex flex-column justify-content-center align-items-center" style="height: 80vh;">
            <h1>Login</h1>
            <form id="loginForm" class="mt-3">
                <input type="text" id="username" class="form-control mb-2" placeholder="Username" required>
                <input type="password" id="password" class="form-control mb-2" placeholder="Password" required>
                <button type="submit" class="btn btn-success w-100">Login</button>
            </form>
            <p class="mt-3">
				<a href="register" id="goToRegister" style="color: grey;">Not registered?</a>
            </p>
		</div>
	`;

    document.getElementById("loginForm").addEventListener("submit", handleLogin);
}
