import UserStatsComponent from "../components/profile/userStats.js"
import UserMatchHistoryComponent from "../components/profile/userMatchHistory.js"
import UserHeaderComponent from "../components/profile/userHeader.js"

export default function renderUserProfile() {
    // Plug the other user infos here
    const main = document.getElementById("main");

    main.innerHTML = `
        <div class="container-fluid profile-container">
            <div class="row justify-content-md-center">
                <div class="col col-md-10">
                    <section id="userHeader"></section>
                    <hr class="hr" style="color: white;" />
                    <section id="userStats"></section>
                    <hr class="hr" style="color: white;" />
                    <section id="userMatchHistory"></section>
                </div>
            </div>
        </div> 
    `;

    // Call every components to fill the sections
    UserHeaderComponent();
    UserStatsComponent();
    UserMatchHistoryComponent();
}
