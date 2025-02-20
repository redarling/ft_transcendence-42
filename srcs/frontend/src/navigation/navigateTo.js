import router from "./router.js"

export default function navigateTo(path) {
	console.log("- function: navigateTo()")
    history.pushState({}, "", path);
    router();
}
