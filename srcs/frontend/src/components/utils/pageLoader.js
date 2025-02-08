export default function PageLoader() {
    const main = document.getElementById("main");
    main.innerHTML = `
        <div class="container d-flex justify-content-center">
            <div class="spinner-border" role="status" style="margin-top: 20px;">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}