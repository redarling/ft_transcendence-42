export default function renderContactUs() {
    const main = document.getElementById("main");
    document.getElementById("header").innerHTML = "";

    main.innerHTML = `
        <div class="container py-5">
            <h1 class="text-center mb-4">Contact Us</h1>
            <p class="text-center text-muted">If you have any questions or inquiries, feel free to reach out to us via the following contact details.</p>

            <div class="card shadow p-4">
                <h2 class="mb-3">📧 Emails</h2>
                <ul class="list-unstyled">
                    <li><strong>Andrii Syvash:</strong> <a href="mailto:asyvash@student.42angouleme.fr" class="text-decoration-none">asyvash@student.42angouleme.fr</a></li>
                    <li><strong>Maxime Briand:</strong> <a href="mailto:mbriand@student.42angouleme.fr" class="text-decoration-none">mbriand@student.42angouleme.fr</a></li>
                    <li><strong>Ismaël Mehdid:</strong> <a href="mailto:imehdid@student.42angouleme.fr" class="text-decoration-none">imehdid@student.42angouleme.fr</a></li>
                </ul>

                <div class="text-center mt-4">
                    <a href="https://github.com/ismaelmehdid/transcendence" target="_blank" class="btn btn-dark">
                        <i class="fab fa-github"></i> Visit GitHub Project
                    </a>
                </div>
            </div>
        </div>
    `;
}
