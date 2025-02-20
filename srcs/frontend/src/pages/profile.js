import UserStatsComponent from "../users/profile/userStats.js"
import UserMatchHistoryComponent from "../users/profile/userMatchHistory.js"
import UserHeaderComponent from "../users/profile/userHeader.js"
import navigateTo from "../navigation/navigateTo.js"
import showLoadingSpinner from "../utils/spinner.js";
import showToast from "../utils/toast.js";
import handleLogout from "../users/handleLogout.js";

export default async function renderUserProfile(userId)
{
    console.log("function: renderUserProfile");
	showLoadingSpinner(true);

    try
    {
        const userProfile = await fetchData(`https://transcendence-pong:7443/api/users/profile/${userId}/`);
        const userStats = await fetchData(`https://transcendence-pong:7443/api/users/stats/${userId}/`);
        const matchHistory = await fetchData(`https://transcendence-pong:7443/api/games/match-history/${userId}/`);

        showLoadingSpinner(false);
        let matchesStats = []; // 2d array containing all matches stats (array dims: 2 * matchesStats.length)
        for (let i = 0; i < matchHistory.length; ++i)
        {
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
        
        if (matchHistory.length > 0)
        {
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

    }
    catch (error)
    {
        showLoadingSpinner(false);
        if (error === "404")
        {
            navigateTo("/404");    
        }
        else
        {
            showToast(error, "error");
            navigateTo("/home");
        }
    }
}

async function fetchData(requestUrl)
{
    const accessToken = localStorage.getItem("access_token")
	if (!accessToken)
	{
		console.log("No access token stored!");
		return ;
	}
	
	const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok)
    {
        throw new Error(response.status);
    }

    return response.json(); // Parse and return the JSON data
}
