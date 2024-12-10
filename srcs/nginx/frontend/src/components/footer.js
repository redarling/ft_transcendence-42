// src/components/footer.js
export default function loadFooter() {
	const footer = document.createElement("footer");
	footer.innerHTML = `
        <p>© 2024 Pong Project</p>
    `;
	const existingFooter = document.querySelector("footer");

	if (existingFooter) {
		// Replace the existing header
		existingFooter.replaceWith(footer);
	} 
	else {
		// Add the header to the top of the body
		document.body.prepend(footer);
	}
}
