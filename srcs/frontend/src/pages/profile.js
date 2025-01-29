import UserStatsComponent from "../components/profile/userStats.js"
import UserMatchHistoryComponent from "../components/profile/userMatchHistory.js"
import UserHeaderComponent from "../components/profile/userHeader.js"
import PageLoader from "../components/utils/pageLoader.js"

export default async function renderUserProfile() {
    PageLoader();

    try {

        // Change the 1 to the real user id we want to check the profile
        const userId = 3;

        const userProfile = await fetchData(`https://transcendence-pong:7443/api/users/profile/${userId}/`);
        const userStats = await fetchData(`https://transcendence-pong:7443/api/users/stats/${userId}/`);
        const matchHistory = await fetchData(`https://transcendence-pong:7443/api/games/match-history/${userId}/`);

        let matchesStats = []; // 2d array containing all matches stats (array dims: 2 * matchesStats.length)
        for (let i = 0; i < matchHistory.length; ++i) {
            const matchStats = await fetchData(`https://transcendence-pong:7443/api/games/match-stats/${matchHistory[i].match.id}/`);
            matchesStats.push(matchStats);
        }

        const main = document.getElementById("main");
        main.style.backgroundColor = '#121212';
        main.innerHTML = `
            <div class="container-fluid">
            <div class="row justify-content-md-center">
                <div class="col col-md-10">
                <section id="userHeader"></section>
                <hr class="hr" style="color: white;" />
                ${matchHistory.length > 0 ? `
                    <section id="userStats"></section>
                    <hr class="hr" style="color: white;" />
                    <section id="userMatchHistory"></section>
                ` : '<p class="text-light" style="text-align: center;">This user has not played any matches yet.</p>'}
                </div>
            </div>
            </div>
        `;
    
        UserHeaderComponent(
            userProfile.username,
            userProfile.avatar,
            userProfile.online_status,
            userStats.registered_at);
        
        if (matchHistory.length > 0) {
            UserStatsComponent(
                userProfile.username,
                userStats.total_matches,
                userStats.total_wins,
                userStats.longest_win_streak,
                userStats.total_points_scored,
                userStats.total_points_against,
                userStats.tournaments_won,
                matchesStats);
            
            UserMatchHistoryComponent(
                userProfile.username,
                matchHistory,
                matchesStats);
        }

    } catch (error) {
        window.alert(error);
        window.location.href = '/';
    }
}

// !Placeholder! -> Token to retreive from connected user
const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6ImJvYjEwIiwidHlwZSI6ImFjY2VzcyIsInNlc3Npb25faWQiOiJmOWFjODIwZi03MTg1LTQ3YTYtYjliOS0wMzg4YTBlMWQ4ZjIiLCJleHAiOjE3MzgxNzg2MzN9.TaXMw6aGRLZ9Sp1piqRGsP3u1jaYiF2l23cazEX9KNzBAWsXGU84Rl8rBVn0_zhlT3DqY_1aBnSgYDQ8sILPDaGS8ysWi-ueTFAYqyyzyoyhM9YzccZZ1JKLYgQ5UMFWACz4hDk0NfZGp_0Hq80nCuuaJt_i0THBKh14FNcTZW3hJzU30b2FmEQ2p2ht1FsfyY7hTeEcRCLwTARAiKzwCBHDo4-4Z5a0KHl5MXILQhhGVf43Yp0f2v2GZeED6-6DEW9IpWFg0x1KJRphh5hA8O28FzsFTsjk-VWI5KwHwQWTs1RBnjOsvJL1DjusY8hOn2ryZCyLSARiJKtXEMrVSQ';
async function fetchData(requestUrl) {
    const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    return response.json(); // Parse and return the JSON data
}
