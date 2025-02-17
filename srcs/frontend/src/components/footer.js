export default function renderFooter() {
    const footer = document.getElementById("footer");
    footer.innerHTML = `
        <footer class="bg-light text-dark py-3">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-md-4 text-center text-md-start">
                        <p class="m-0">&copy; 2025 Transcendence Pong. All rights reserved.</p>
                    </div>

                    <div class="col-md-4 text-center">
                        <a href="/privacy-policy" class="text-dark text-decoration-none mx-2" target="_blank">Privacy Policy</a>
                    </div>

                    <div class="col-md-4 text-center text-md-end">
						<a href="/contact-us" class="text-dark text-decoration-none mx-2" target="_blank">Contact Us</a>
                    </div>
                </div>
            </div>
        </footer>
    `;
}
