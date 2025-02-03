// export default function renderLogin() {
//     const main = document.getElementById("main");
//     main.innerHTML = `
//         <div class="d-flex flex-column justify-content-center align-items-center" style="height: 80vh;">
//             <h1>* GONP *</h1>
//             <form id="loginForm" class="mt-3">
//                 <input type="text" id="username" class="form-control mb-2" placeholder="Username" required>
//                 <input type="password" id="password" class="form-control mb-2" placeholder="Password" required>
//                 <button type="submit" class="btn btn-success w-100">Login</button>
//             </form>
// 			</div>
// 			`;
// 			// <button id="login42" class="btn btn-primary mt-3">Login with 42 ID</button>
			
// 			document.getElementById("loginForm").addEventListener("submit", handleLogin);
// }

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
    // document.getElementById("goToRegister").addEventListener("click", renderRegister);
}


async function handleLogin(event) {
    event.preventDefault(); // Prevent page reload

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("https://transcendence-pong:7443/api/users/login/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
            alert("Login successful!");
            // Redirect to the main page or call a function to update UI
        } 
		else {
            alert(data.detail || "Login failed!");
        }
    } 
	catch (error) {
        alert("Network error. Try again!");
    }
}

// async function refreshToken() {
//     const refresh_token = localStorage.getItem("refresh_token");
//     if (!refresh_token) return;

//     try {
//         const response = await fetch("https://transcendence-pong:7443/api/users/token-refresh/", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ refresh_token }),
//         });

//         const data = await response.json();
//         if (response.ok) {
//             localStorage.setItem("access_token", data.access_token);
//         } else {
//             localStorage.removeItem("access_token");
//             localStorage.removeItem("refresh_token");
//         }
//     } catch (error) {
//         console.error("Failed to refresh token.");
//     }
// }

// // Refresh token every 10 minutes
// setInterval(refreshToken, 10 * 60 * 1000);
