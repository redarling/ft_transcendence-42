export function getUserId() {
    const token = localStorage.getItem("access_token");
    if (!token) return null;

    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        const decoded = JSON.parse(jsonPayload);
        return decoded.user_id;
    } 
	catch (error) {
        console.error("⚠️ Failed to decode JWT:", error);
        return null;
    }
}
