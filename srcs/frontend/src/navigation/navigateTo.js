import router from "./router.js"

export default function navigateTo(path) {
	console.log("- start: navigateTo()")
    history.pushState({}, "", path);
    router();
}
