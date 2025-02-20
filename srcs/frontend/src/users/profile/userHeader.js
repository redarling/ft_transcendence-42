import sendFriendRequest from "../friends_management/sendFriendRequest.js";

export default function UserHeaderComponent(userName, avatarPicturePath, connected, joinedDate) {
    const userMatchHistorySection = document.querySelector('#userHeader');
    const currentUserId = localStorage.getItem("user_id");
    const profileUrl = window.location.href;
    const profileUserId = profileUrl.match(/\/profile\/(\d+)\//)?.[1];

    userMatchHistorySection.innerHTML = `
        <div class="d-flex p-3 align-items-center">
            <img src="${avatarPicturePath}" alt="ProfileImage" class="rounded-circle" style="width: 180px; height: 180px; object-fit: cover;" />
            <div class="d-flex flex-column ps-3">
                <h4 class="text-light mb-0">${userName}</h4>
                <span class="text-light">${joinedDate}</span>
                <span id="onlineStatus" class="badge rounded-pill text-bg-${connected ? 'success' : 'secondary'}">
                    ${connected ? 'Online' : 'Offline'}
                </span>
                <div class="mt-2">
                    ${profileUserId !== currentUserId ? '<button id="friendRequestButton" class="btn btn-sm btn-primary">Add Friend</button>' : ''}
                </div>
            </div>
        </div>
    `;

    if (profileUserId !== currentUserId) {
        document.getElementById("friendRequestButton").addEventListener("click", () => { sendFriendRequest(profileUserId); });
    }
}