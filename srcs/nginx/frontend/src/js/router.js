import Home from './components/home.js';
import About from './components/about.js';
import Contact from './components/contact.js';

// Function to handle navigation
function navigateTo(url) {
    history.pushState(null, null, url);
    router();
}

// Function to handle routing
async function router() {
    const routes = [
        { path: "/", view: () => console.log("Viewing Home") },
        { path: "/about", view: About },
        { path: "/contact", view: () => console.log("Viewing Contact") }
    ];

    // Test each route for potential match
    const potentialMatches = routes.map(route => {
        return {
            route: route,
            isMatch: location.pathname === route.path
        };
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);

    if (!match) {
        match = {
            route: routes[0],
            isMatch: true
        };
    }

    document.querySelector('#app').innerHTML = await match.route.view();
}

// Event listener for navigation links
document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault();
            navigateTo(e.target.href);
        }
    });

    router();
});

// Handle back/forward navigation
window.addEventListener("popstate", router);
