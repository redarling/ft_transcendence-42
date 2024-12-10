export default function loadHomePage() 
{
	// Assuming a root div with id="app"
	const root = document.getElementById("main");
	root.innerHTML = `
	  <div class="container">
		<h1>Welcome to Transcendence</h1>
		<p>This is the home page.</p>
		<button id="start-button" class="btn btn-primary">Start Game</button>
	
		</div>
	`;

	// Add event listeners if necessary
	document.getElementById("start-button").addEventListener("click", () => 
	{
		console.log("Game started!");
	});
}
