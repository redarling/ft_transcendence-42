export default function renderHeader() {
    const header = document.getElementById("header");
    header.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-light bg-light" style="height: 10vh;">
            <a class="navbar-brand px-3" href="home">
                <img src="./src/assets/images/logo/t_black.png" height="40" width="40" alt="" />
                Gonp
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav ms-auto px-3">
                    <li class="nav-item">
                        <a class="nav-link active" aria-current="page" href="home">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="game">Game</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="settings">Settings</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="login">Logout</a>
                    </li>
                </ul>
            </div>
        </nav>
    `;
}