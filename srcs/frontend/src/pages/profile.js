import UserStatsComponent from "../components/profile/userStats.js"
import UserMatchHistoryComponent from "../components/profile/userMatchHistory.js"
import UserHeaderComponent from "../components/profile/userHeader.js"
import PageLoader from "../components/utils/pageLoader.js"

export default async function renderUserProfile() {
    PageLoader();

    try {

        // Change the 1 to the real user id we want to check the profile
        const userId = 1;

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
const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImJvYjEyIiwidHlwZSI6ImFjY2VzcyIsInNlc3Npb25faWQiOiIyOTE2ZDI5MC00N2VhLTQzNTktYjQ5OS05ZWM2ZmQwZjZiOWEiLCJleHAiOjE3Mzg4NjQwMTJ9.WNb0O0DzaQn2ugQUAmM5kFwEa2grSvidcd3DDaOxoa2p3IhCPJ39apCAMg1dCSkrYhPKD_ro8BrIhQ-ntnf8SfPUBZMA_5vvKELD8_1a6ESHtUdyUX2h6KzhYPw0ElHjF9LHJ7X3t2MQwxiPJv0OI8tdnvyJDwohSjfF-mT4oMUa5YZePz9LhGyOMlmVsaA2n_A-m296WGFuMwj6uSB3vLBClHZElCZlBO2nvVjbjXibgiyS4d3yOtO7_53aTLWHiX8hz5Gd9Y8PAK62zv1KaMWPPJpiboo0fkO0cuVrk_jwirjJd-MB2wLnWXZIXDpkBSjML7ugvfhVbue7JUVfoA';
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
