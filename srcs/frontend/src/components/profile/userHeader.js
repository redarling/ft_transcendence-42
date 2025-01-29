export default function UserHeaderComponent(userName, avatarPicturePath, connected, joinedDate) {
    const userMatchHistorySection = document.querySelector('#userHeader');
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
                    <button class="btn btn-sm btn-primary">Add Friend</button>
                </div>

            </div>
        </div>
    `;
}
