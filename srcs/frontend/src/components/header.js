import navigateTo from "../navigation/navigateTo.js";
import handleLogout from "../users/handleLogout.js";

export default function renderHeader() {
	const isAuthenticated = localStorage.getItem("access_token") !== null;

	const header = document.getElementById("header");
	header.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-light bg-body-tertiary" role="navigation">
        <div class="container-fluid">
            <a class="navbar-brand" aria-label="Gonp - Home" id="logoHeaderButton">
                <img src="./src/assets/images/logo/t_black.png" height="50" width="50" />
                Gonp
            </a>
    
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
            </button>
    
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                    <li class="nav-item">
                        <a class="nav-link" id="homeHeaderButton" role="menuitem">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="gameHeaderButton" role="menuitem">Play</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="profileHeaderButton" role="menuitem">Profile</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="settingsHeaderButton" role="menuitem">Settings</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="authHeaderButton">${isAuthenticated ? "Logout" : "Login"}</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    `;

	let userId = localStorage.getItem("user_id");
	if (!userId)
		userId = 1;

	document.getElementById("logoHeaderButton").addEventListener("click", () => {navigateTo("/home");});
	document.getElementById("homeHeaderButton").addEventListener("click", () => {navigateTo("/home");});
	document.getElementById("gameHeaderButton").addEventListener("click", () => {navigateTo("/game");});
	document.getElementById("settingsHeaderButton").addEventListener("click", () => {navigateTo("/settings");});
	document.getElementById("profileHeaderButton").addEventListener("click", () => {navigateTo(`/profile/${userId}/`);});

	const authButton = document.getElementById("authHeaderButton");
	if (isAuthenticated) {
		authButton.addEventListener("click", handleLogout);
	} 
	else {
		authButton.addEventListener("click", () => navigateTo("/login"));
	}
}
