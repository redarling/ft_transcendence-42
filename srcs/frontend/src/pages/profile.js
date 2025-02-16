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
const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImJvYjMiLCJ0eXBlIjoiYWNjZXNzIiwic2Vzc2lvbl9pZCI6ImMwNjBmZGQ0LWUxMGYtNDhjMy1hNWM1LTBkYTljMDQxOTAyOSIsImV4cCI6MTczOTQ4Mzk0OX0.sA828yOle0WXVN_IH2qd8AQwOR6iZt744CO9pODTPHk5ZKTEAjToZeJj5BIyTjeL09PvcCRZcLj44f3F1yc2d_Ybyrsm4xg1T_iltt40R0qKqJjip0T6BrRNMUE9TLlh5IQrn9s8ZWcql3aHOMgjD5UawBt-YzC-Yse4Bp-gNWmleDnHC_IEFQYp_VqBMHpn2Kx9jwDXetraIigFrOF9rjZMbAOmFiEFeiQ_9n5rnJSVeTKJPJocI0RNsT2GB9WeE3k_R3cBEbMIaVePrw_B1YzJAnLZLEoS5LZNOqm-jq3LkYNMp_9xJyBOgYiq-i56LzFydBvS6Zz_f7jNzA3BQQ';
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
