export default function renderLogin() {
    const main = document.getElementById("main");
    main.innerHTML = `
        <div class="d-flex flex-column justify-content-center align-items-center" style="height: 80vh;">
            <h1>* GONP *</h1>
            <button type="button" class="btn btn-primary mt-3">Login with 42 ID</button>
        </div>
    `;
}
