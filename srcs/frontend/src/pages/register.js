import navigateTo from "../navigation/navigateTo.js";
import handleRegister from "../users/handleRegister.js";

export default function renderRegister() {
    console.log("- function: renderRegister()");
    const main = document.getElementById("main");
    main.innerHTML = `
        <div class="container d-flex justify-content-center align-items-center">
            <div class="row">
                <h1>Register</h1>
                <form id="registerForm" class="mt-3">
                    <input type="text" id="username" class="form-control mb-2" placeholder="Username" required>
                    <input type="email" id="email" class="form-control mb-2" placeholder="Email" required>

                    <div class="input-group mb-2">
                        <input type="password" id="password" class="form-control" placeholder="Password" required>
                        <button class="btn btn-outline-secondary toggle-password" type="button" data-target="password">Show</button>
                    </div>

                    <div class="input-group mb-2">
                        <input type="password" id="confirmPassword" class="form-control" placeholder="Confirm Password" required>
                        <button class="btn btn-outline-secondary toggle-password" type="button" data-target="confirmPassword">Show</button>
                    </div>

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

    const registerForm = document.getElementById("registerForm");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const privacyCheckbox = document.getElementById("privacyPolicy");
    const registerButton = registerForm.querySelector("button[type='submit']");

    document.getElementById("goToLogin").addEventListener("click", () => navigateTo("/login"));

    document.getElementById("privacyLink").setAttribute("href", "/privacy-policy");
    document.getElementById("privacyLink").setAttribute("target", "_blank");

    function validateForm() {
        const passwordsMatch = passwordInput.value === confirmPasswordInput.value;
        const allFieldsFilled = registerForm.checkValidity();
        registerButton.disabled = !(passwordsMatch && allFieldsFilled);
    }

    passwordInput.addEventListener("input", validateForm);
    confirmPasswordInput.addEventListener("input", validateForm);
    privacyCheckbox.addEventListener("change", validateForm);

    registerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (passwordInput.value !== confirmPasswordInput.value) {
            alert("Passwords do not match!");
            return;
        }
        handleRegister(event);
    });

    document.querySelectorAll(".toggle-password").forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-target");
            const input = document.getElementById(targetId);
            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            button.textContent = isPassword ? "Hide" : "Show";
        });
    });
}
