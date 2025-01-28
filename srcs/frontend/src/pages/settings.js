export default function renderHome() {
	const main = document.getElementById("main");
	main.innerHTML = `
	<div class="d-flex flex-column justify-content-center align-items-center" style="height: 80vh;">
		<h1 class="mb-4">Settings</h1>
		<form class="w-50">
			<div class="mb-3">
				<label for="username" class="form-label">Username:</label>
				<input type="text" id="username" name="username" class="form-control" value="${getRandomUsername()}">
			</div>
			<div class="mb-3">
				<label for="email" class="form-label">Email:</label>
				<input type="email" id="email" name="email" class="form-control" value="${getRandomEmail()}">
			</div>
			<div class="mb-3">
				<label for="password" class="form-label">Password:</label>
				<input type="password" id="password" name="password" class="form-control">
			</div>
			<button type="submit" class="btn btn-primary">Save</button>
		</form>
	</div>
	`;
}

function getRandomUsername() {
	const usernames = ['user123', 'maxime', 'guest', 'admin'];
	return usernames[Math.floor(Math.random() * usernames.length)];
}

function getRandomEmail() {
	const emails = ['user123@example.com', 'maxime@example.com', 'guest@example.com', 'admin@example.com'];
	return emails[Math.floor(Math.random() * emails.length)];
}

function getRandomNotificationSetting() {
	return Math.random() >= 0.5;
}
