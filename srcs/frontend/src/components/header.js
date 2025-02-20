import navigateTo from "../navigation/navigateTo.js";
import { handleLogout } from "../users/handleLogout.js";
import isAuthenticated from "../utils/isAuthenticated.js";

export default function renderHeader()
{
    const auth = isAuthenticated();

    const header = document.getElementById("header");

    const navHTML = `
        <nav class="navbar navbar-expand-lg navbar-light bg-body-tertiary" role="navigation">
            <div class="container-fluid">
                <a class="navbar-brand" aria-label="Pong - Home" id="logoHeaderButton">
                    <img src="./src/assets/images/logo/t_black.png" height="50" width="50" />
                    Pong
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" 
                        data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" 
                        aria-expanded="false" aria-label="Toggle navigation">
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
                        ${auth ? `
                        <li class="nav-item">
                            <a class="nav-link" id="profileHeaderButton" role="menuitem">Profile</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" id="settingsHeaderButton" role="menuitem">Settings</a>
                        </li>
                        ` : ``}
                        <li class="nav-item">
                            <a class="nav-link" id="authHeaderButton" role="menuitem">
                                ${auth ? "Logout" : "Login"}
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    `;

    header.innerHTML = navHTML;

    const logoHeaderButton = document.getElementById("logoHeaderButton");
    const homeHeaderButton = document.getElementById("homeHeaderButton");

    if (logoHeaderButton)
        logoHeaderButton.addEventListener("click", () => navigateTo("/home"));

    if (homeHeaderButton)
        homeHeaderButton.addEventListener("click", () => navigateTo("/home"));

    const gameHeaderButton = document.getElementById("gameHeaderButton");
    if (gameHeaderButton)
    {
        gameHeaderButton.addEventListener("click", () => {
                navigateTo("/game");
        });
    }

    const authHeaderButton = document.getElementById("authHeaderButton");
    if (authHeaderButton)
    {
        if (auth)
            authHeaderButton.addEventListener("click", handleLogout);
        else
            authHeaderButton.addEventListener("click", () => navigateTo("/login"));
    }

    const userId = localStorage.getItem("user_id");
    if (auth)
    {
        const settingsHeaderButton = document.getElementById("settingsHeaderButton");
        if (settingsHeaderButton)
        {
            settingsHeaderButton.addEventListener("click", () => navigateTo("/settings"));
        }
        const profileHeaderButton = document.getElementById("profileHeaderButton");
        if (profileHeaderButton && userId)
        {
            profileHeaderButton.addEventListener("click", () => navigateTo(`/profile/${userId}/`));
        }
    }
}
