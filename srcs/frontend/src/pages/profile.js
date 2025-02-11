import UserStatsComponent from "../components/profile/userStats.js"
import UserMatchHistoryComponent from "../components/profile/userMatchHistory.js"
import UserHeaderComponent from "../components/profile/userHeader.js"
import PageLoader from "../components/utils/pageLoader.js"
import navigateTo from "../navigation/navigateTo.js"

export default async function renderUserProfile(userId) {
	console.log("- start: renderUserProfile()")
	PageLoader();

    try {

        // Change the 1 to the real user id we want to check the profile

        const userProfile = await fetchData(`https://transcendence-pong:7443/api/users/profile/${userId}/`);
        const userStats = await fetchData(`https://transcendence-pong:7443/api/users/stats/${userId}/`);
        const matchHistory = await fetchData(`https://transcendence-pong:7443/api/games/match-history/${userId}/`);

        let matchesStats = []; // 2d array containing all matches stats (array dims: 2 * matchesStats.length)
        for (let i = 0; i < matchHistory.length; ++i) {
            const matchStats = await fetchData(`https://transcendence-pong:7443/api/games/match-stats/${matchHistory[i].match.id}/`);
            matchesStats.push(matchStats);
        }

        const main = document.getElementById("main");
        main.innerHTML = `
            <div class="container-fluid profile-container">
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
        if (error === "404") {
            navigateTo("/404");    
        } else {
            window.alert(`${error}\nCouldn't get the data of the user profile :(`);
            navigateTo("/home");
        }

    }
}

// !Placeholder! -> Token to retreive from connected user
const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VybmFtZSI6ImJvYjE1IiwidHlwZSI6ImFjY2VzcyIsInNlc3Npb25faWQiOiJlNzYxYTFiZi1iMDBkLTQ1N2MtOWI1NS0xMmU5MzBhMzNjMDciLCJleHAiOjE3Mzg5Nzc2MjB9.Dn7bF-iuF2WTFTAoXhO2A7z1PH7GvVIy1nidBnOn0va-FsbT2BBKYSFSUcciYEqjxejh172VuaYuVCMvjs3f0gRtxAfn0rxniy9eDGCSrozEEe0M8SH1_JASOfZ3_kb-rmSXsigk-Cucanq_EACYCfQxY1sFMFNPjEb-_lQGF6-DTF4HRz2cCt5sPzTAK7H6bApfxKgwnK-lsBo9qjMCTeYPUKvCyhnNX2PvzEmAEIzXBsYJ9zCGCrjLAeNzAQCCDARmcRSFlahGRv6IvbbbQjB9E9HHi9bgJcaiDPSkdoCYPzpCuIhsE9IqHn5TNAnD0JJPjCIZA8Zc_RRPul14nA';
async function fetchData(requestUrl) {
    const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json(); // Parse and return the JSON data
}
