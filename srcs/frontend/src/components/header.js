import navigateTo from "../main.js"

// async function handleLogout()
// {

// }

export default function renderHeader() {
    const header = document.getElementById("header");
    header.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-light bg-light" style="height: 10vh;">
            <a class="navbar-brand px-3" id="homeHeader">
                <img src="./src/assets/images/logo/t_black.png" height="40" width="40" alt="" />
                Gonp
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav ms-auto px-3">
                    <li class="nav-item">
                        <a class="nav-link active" aria-current="page" id="home">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="gameHeader">Game</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="tournamentsHeader">Tournaments</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="settingsHeader">Settings</a>
                    </li>
					<li class="nav-item">
						<a class="nav-link" id="profileHeader">Profile</a>
					</li>
                    <li class="nav-item">
                        <a class="nav-link" id="loginHeader">Login</a>
					</li>
				</ul>
            </div>
        </nav>
    `;
	document.getElementById("homeHeader").addEventListener("click", () => navigateTo("/home"));
	document.getElementById("gameHeader").addEventListener("click", () => navigateTo("/game"));
	document.getElementById("tournamentsHeader").addEventListener("click", () => navigateTo("/tournaments"));
	document.getElementById("settingsHeader").addEventListener("click", () => navigateTo("/settings"));
	document.getElementById("profileHeader").addEventListener("click", () => navigateTo("/profile"));
	document.getElementById("loginHeader").addEventListener("click", () => navigateTo("/login"));
	// document.getElementById("logout").addEventListener("click", handleLogout());
}