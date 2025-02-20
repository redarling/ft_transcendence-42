import navigateTo from "../navigation/navigateTo.js";

export default function renderHome()
{	
	const main = document.getElementById("main");
	main.innerHTML = `
		<main class="container my-5">
		<!-- Hero Section -->
		<section class="text-center bg-light py-5 rounded shadow">
			<h1 class="display-4 fw-bold">Welcome to Transcendence Pong!</h1>
			<p class="lead text-muted">Experience the ultimate online Pong battles with friends or with ai opponent.</p>
			<a href="game" class="btn btn-primary btn-lg mt-3" id="playNowBtn">Play Now</a>
		</section>

		<!-- Features Section -->
		<section class="mt-5">
			<div class="row text-center">
			<!-- Feature 1 -->
			<div class="col-md-4">
				<i class="bi bi-people-fill text-primary fs-1"></i>
				<h3 class="mt-3">Multiplayer</h3>
				<p>Challenge friends in real-time Pong matches.</p>
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
				<h3 class="mt-3">AI opponent</h3>
				<p>Improve your skills training with ai of different level.</p>
			</div>
			</div>
		</section>

		<!-- Creators pres -->
		<section class="text-center bg-light mt-5 py-5 rounded shadow">
			<h3>An original game by</h3>
			<div class="row py-4">
				<!-- Creator 1 -->
				<div class="col-md-4 d-flex justify-content-center align-items-center">
					<div class="card text-center py-3" style="width: 350px; height: 380px;">
						<img src="./src/assets/images/creators/imehdid.jpg" style="width: 220px; height: 220px;" class="rounded-circle mb-3 mx-auto" alt="Creator 1">
						<h5>Ismael Mehdid</h5>
						<ul class="list-unstyled mt-3">
							<li>- Game and AI Developer</li>
							<li>- Blockchain Integration Engineer</li>
						</ul>
					</div>
				</div>
				<!-- Creator 2 -->
				<div class="col-md-4 d-flex justify-content-center align-items-center">
					<div class="card text-center py-3" style="width: 350px; height: 380px;">
					<img src="./src/assets/images/creators/mbriand.png" style="width: 220px; height: 220px;" class="rounded-circle mb-3 mx-auto" alt="Creator 2">
					<h5>Maxime Briand</h5>
					<ul class="list-unstyled mt-3">
						<li>- Front-end Developer</li>
					</ul>
				</div>
				</div>
				<!-- Creator 3 -->
				<div class="col-md-4 d-flex justify-content-center align-items-center">
					<div class="card text-center py-3" style="width: 350px; height: 380px;">
					<img src="./src/assets/images/creators/asyvash.jpg" style="width: 220px; height: 220px;" class="rounded-circle mb-3 mx-auto" alt="Creator 1">
					<h5 >Andrii Syvash</h5>
					<ul class="list-unstyled mt-3">
						<li>- Full-stack Developer</li>
						<li>- Cybersecurity Specialist</li>
					</ul>
					</div>
				</div>
		</section>
		</main>
	`;
    
	const playNowBtn = document.getElementById("playNowBtn");

	if (playNowBtn)
	{
		playNowBtn.addEventListener("click", () => {
			navigateTo("/game");
		});
	}
}
