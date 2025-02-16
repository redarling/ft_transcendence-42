import navigateTo from "../navigation/navigateTo.js";
import handleRegister from "../users/handleRegister.js";

export default function renderRegister() {
    console.log("- start: renderRegister()");
    const main = document.getElementById("main");
    main.innerHTML = `
        <div class="container d-flex justify-content-center align-items-center">
            <div class="row">
                <h1>Register</h1>
                <form id="registerForm" class="mt-3">
                    <input type="text" id="username" class="form-control mb-2" placeholder="Username" required>
                    <input type="email" id="email" class="form-control mb-2" placeholder="Email" required>
                    <input type="password" id="password" class="form-control mb-2" placeholder="Password" required>

                    <div class="form-check mb-2">
                        <input type="checkbox" id="privacyPolicy" class="form-check-input" required>
                        <label for="privacyPolicy" class="form-check-label">
                            I agree to the <a href="#" id="privacyLink">Privacy Policy</a>
                        </label>
                    </div>

                    <button type="submit" class="btn btn-success w-100" disabled>Register</button>
                </form>
                <p class="mt-3">
                    <a id="goToLogin" class="link-like" style="color: grey; cursor: pointer;">Already have an account? Login</a>
                </p>
            </div>
        </div>
    `;

    document.getElementById("goToLogin").addEventListener("click", () => navigateTo("/login"));
    document.getElementById("registerForm").addEventListener("submit", handleRegister);
    
    document.getElementById("privacyLink").setAttribute("href", "/privacy");
    document.getElementById("privacyLink").setAttribute("target", "_blank");

    const privacyCheckbox = document.getElementById("privacyPolicy");
    const registerButton = document.querySelector("#registerForm button");

    privacyCheckbox.addEventListener("change", () => {
        registerButton.disabled = !privacyCheckbox.checked;
    });
}
