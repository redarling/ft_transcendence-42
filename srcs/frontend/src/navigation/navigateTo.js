import router from "./router.js"

export default async function navigateTo(path)
{
	console.log("- function: navigateTo()")
    history.pushState({}, "", path);
    await router();
}

