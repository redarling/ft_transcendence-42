export default function renderHome() {
	const main = document.getElementById("main");
	main.innerHTML = `
		<main class="container my-5">
		<!-- Hero Section -->
		<section class="text-center bg-light py-5 rounded shadow">
			<h1 class="display-4 fw-bold">Welcome to Pong Project!</h1>
			<p class="lead text-muted">Experience the ultimate online Pong battles with friends or random players across the globe.</p>
			<a href="game" class="btn btn-primary btn-lg mt-3">Play Now</a>
		</section>

		<!-- Features Section -->
		<section class="mt-5">
			<div class="row text-center">
			<!-- Feature 1 -->
			<div class="col-md-4">
				<i class="bi bi-people-fill text-primary fs-1"></i>
				<h3 class="mt-3">Multiplayer</h3>
				<p>Challenge players worldwide in real-time Pong matches.</p>
			</div>
			<!-- Feature 2 -->
			<div class="col-md-4">
				<i class="bi bi-trophy-fill text-success fs-1"></i>
				<h3 class="mt-3">Tournaments</h3>
				<p>Compete in exciting tournaments to become the Pong champion.</p>
			</div>
			<!-- Feature 3 -->
			<div class="col-md-4">
				<i class="bi bi-chat-dots-fill text-info fs-1"></i>
				<h3 class="mt-3">Live Chat</h3>
				<p>Connect with your opponents and friends during the game.</p>
			</div>
			</div>
		</section>

		<!-- Call to Action -->
		<section class="text-center mt-5">
			<p class="lead">Are you ready to start your Pong journey?</p>
			<a href="#get-started" class="btn btn-outline-secondary btn-lg">Get Started</a>
		</section>
		</main>
	`;
}
