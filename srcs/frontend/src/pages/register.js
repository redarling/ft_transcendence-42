import navigateTo from "../main.js"

async function handleRegister(event) {
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
		
        const data = await response.json();

		if (response.ok) {
			navigateTo('/login');
		} 
		else {
            alert(data.detail || "Registration failed!");
        }
    } 
	catch (error) {
        alert("Network error. Try again!");
    }
}

export default function renderRegister() {
    const main = document.getElementById("main");
    main.innerHTML = `
        <div class="d-flex flex-column justify-content-center align-items-center" style="height: 80vh;">
            <h1>Register</h1>
            <form id="registerForm" class="mt-3">
                <input type="text" id="username" class="form-control mb-2" placeholder="Username" required>
                <input type="email" id="email" class="form-control mb-2" placeholder="Email" required>
                <input type="password" id="password" class="form-control mb-2" placeholder="Password" required>
                <button type="submit" class="btn btn-success w-100">Register</button>
            </form>
			<p class="mt-3">
				<a id="goToLogin" style="color: grey;">Already have an account? Login</a>
			</p>
        </div>
    `;
	document.getElementById("goToLogin").addEventListener("click", () => navigateTo("/login"));
    document.getElementById("registerForm").addEventListener("submit", handleRegister);
}
