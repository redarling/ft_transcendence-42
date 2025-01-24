export default function UserHeaderComponent() {
    const userMatchHistorySection = document.querySelector('#userHeader');
    userMatchHistorySection.innerHTML = `
        <div class="d-flex p-3 align-items-center">
            <img src="./src/assets/images/placeholders/profile-picture-placeholder.jpg" alt="ProfileImage" class="rounded-circle" style="width: 180px; height: 180px; object-fit: cover;" />
            <div class="d-flex flex-column ps-3">
                <h4 class="text-light mb-0">The Name</h4>
                <span class="text-light">Joined Aug 8, 2024</span>
                <div class="mt-2">
                    <button class="btn btn-sm btn-primary">Add Friend</button>
                </div>
            </div>
        </div>
    `;
}