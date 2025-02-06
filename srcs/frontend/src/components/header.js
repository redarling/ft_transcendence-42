import navigateTo from "../main.js"

// async function handleLogout()
// {

// }

export default function renderHeader() {
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
                        <a class="nav-link active" id="homeHeaderButton" aria-current="page" role="menuitem">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="gameHeaderButton" role="menuitem">Game</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="tournamentsHeaderButton" role="menuitem">Tournaments</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="settingsHeaderButton" role="menuitem">Settings</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="profileHeaderButton" role="menuitem">Profile</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="loginHeaderButton" role="menuitem">Login</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    `;

    function setActivePage(pageId) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.id === pageId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    document.getElementById("logoHeaderButton").addEventListener("click", () => {
        navigateTo("/home")
        setActivePage("homeHeaderButton");
    });
	document.getElementById("homeHeaderButton").addEventListener("click", () => {
        navigateTo("/home")
        setActivePage("homeHeaderButton");
    });
	document.getElementById("gameHeaderButton").addEventListener("click", () => {
        navigateTo("/game")
        setActivePage("gameHeaderButton");
    });
	document.getElementById("tournamentsHeaderButton").addEventListener("click", () => {
        navigateTo("/tournaments")
        setActivePage("tournamentsHeaderButton");
    });
	document.getElementById("settingsHeaderButton").addEventListener("click", () => {
        navigateTo("/settings")
        setActivePage("settingsHeaderButton");
    });
	document.getElementById("profileHeaderButton").addEventListener("click", () => {
        navigateTo("/profile")
        setActivePage("profileHeaderButton");
    });
	document.getElementById("loginHeaderButton").addEventListener("click", () => {
        navigateTo("/login")
        setActivePage("loginHeaderButton");
    });
	// document.getElementById("logout").addEventListener("click", handleLogout());
}