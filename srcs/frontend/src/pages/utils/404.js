import navigateTo from "../../navigation/navigateTo.js"

export default function render404() {
    const main = document.getElementById("main");
    main.innerHTML = `
        <div class="container d-flex justify-content-center align-items-center">
            <div class="col text-center">
                <h1 class="display-1"><strong>404</strong></h1>
                <p class="lead">Oops! The page you are looking for does not exist.</p>
                <a class="btn btn-primary" id="goHomeBtn">Go Home</a>
            </div>
        </div>
    `;

    const homeBtn = document.getElementById("goHomeBtn");
    homeBtn.addEventListener("click", async () => {
        await navigateTo("/home");
    });
}
