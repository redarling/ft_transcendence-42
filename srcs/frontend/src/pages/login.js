import navigateTo from "../navigation/navigateTo.js";
import handleLogin from "../users/handleLogin.js";

export default function renderLogin() {
	console.log("- start: renderLogin()");
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
