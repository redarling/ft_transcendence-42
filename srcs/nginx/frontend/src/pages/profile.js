import UserStatsComponent from "../components/profile/userStats.js"
import UserMatchHistoryComponent from "../components/profile/userMatchHistory.js"

export default function renderUserProfile() {
    // Plug the other user infos here
    const main = document.getElementById("main");

    main.innerHTML = `
        <div class="container-fluid profile-container">
            <div class="row justify-content-md-center">
                <div class="col col-md-10">
                    <hr class="hr" style="color: white;" />
                    <section id="userStats"></section>
                    <hr class="hr" style="color: white;" />
                    <section id="userMatchHistory"></section>
                </div>
            </div>
        </div>
    `;

    // Appelle les fonctions pour remplir les sections
    UserStatsComponent();
    UserMatchHistoryComponent();
}