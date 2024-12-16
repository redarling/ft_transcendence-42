export default function renderHeader() {
	const header = document.getElementById("header");
	header.innerHTML = `
		<nav class="navbar navbar-expand-lg navbar-light bg-light" style="height: 10vh;">
			<a class="navbar-brand" href="home">
				<img src="./src/public/images/t_black.png" height="40" width="40" alt="" />
				Gonp
			</a>
			<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
				<span class="navbar-toggler-icon"></span>
			</button>

			<div class="collapse navbar-collapse" id="navbarSupportedContent">
				<ul class="navbar-nav ml-auto">
					<li class="nav-item active">
						<a class="nav-link" href="home">Home <span class="sr-only">(current)</span></a>
					</li>

					<li class="nav-item">
						<a class="nav-link" href="game">Game <span class="sr-only">(current)</span></a>
					</li>

					<li class="nav-item">
						<a class="nav-link" href="settings"> Settings <span class="sr-only">(current)</span></a>
					</li>

					<li class="nav-item">
						<a class="nav-link" href="login">Logout</a>
					</li>
				</ul>
			</div>
		</nav>
	`;
}
	
