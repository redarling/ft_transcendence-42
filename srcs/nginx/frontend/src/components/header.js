// export function loadHeader()
// {
// 	const template = document.getElementById("navbar-template");
// 	const app = document.getElementById("app");
// 	if (template && app)
// 		app.appendChild(template.content.cloneNode(true)); // Clone and append the template}
//     else
// 		console.error("Failed to load header: template or app not found");
// }

export async function loadHeader() {
	const header = document.getElementById("header"); // Target container
	try {
		// Fetch the HTML content of header.html
		const response = await fetch("../html/header.html"); // Adjust the path as needed
		if (!response.ok) {
			throw new Error(`Failed to load header: ${response.statusText}`);
		}
		// Get the HTML text and insert it into the container
		const html = await response.text();
		header.innerHTML = html;
	} 
	catch (error) {
		console.error(error);
		header.innerHTML = `<p>Failed to load the header. Please try again later.</p>`;
	}
}
