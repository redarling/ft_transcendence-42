import removeFriend from "../users/friends_management/removeFriend.js";
import acceptFriendRequest from "../users/friends_management/acceptFriendRequest.js";
import declineFriendRequest from "../users/friends_management/declineFriendRequest.js";
import navigateTo from "../navigation/navigateTo.js";
import { fetchWithAuth } from "../utils/fetchWithAuth.js";
import showToast from "../utils/toast.js";
import showLoadingSpinner from "../utils/spinner.js";

export default function renderFriends()
{
    const main = document.getElementById("main");

    main.innerHTML = `
        <div class="container mb-5" style="padding-top: 25px; max-width: 600px; margin: 0 auto;">
            <h1 class="text-center">Friends</h1>
            <p class="text-muted text-center">Manage your friends and requests below:</p>

            <ul class="nav nav-tabs" id="friendTabs">
                <li class="nav-item">
                    <a class="nav-link active" id="friendListTab">Friends</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="friendRequestTab">Requests</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="friendSearchTab">Search new friends</a>
                </li>
            </ul>

            <div id="friendList" class="friend-content">
                <ul id="friendsContainer" class="list-group mt-3"></ul>
            </div>
            <div id="friendRequests" class="friend-content d-none">
                <ul id="requestsContainer" class="list-group mt-3"></ul>
            </div>
            <div id="friendSearch" class="friend-content d-none">
                <div class="input-group mt-3">
                    <input type="text" id="searchInput" class="form-control" placeholder="Enter username...">
                    <button class="btn btn-primary" id="searchButton">Search</button>
                </div>
                <ul id="searchResultsContainer" class="list-group mt-3"></ul>
            </div>
        </div>
    `;

    document.getElementById("friendListTab").addEventListener("click", (event) => {
        event.preventDefault();
        toggleTab("friendList", "friendListTab");
    });
    document.getElementById("friendRequestTab").addEventListener("click", (event) => {
        event.preventDefault();
        toggleTab("friendRequests", "friendRequestTab");
    });
    document.getElementById("friendSearchTab").addEventListener("click", (event) => {
        event.preventDefault();
        toggleTab("friendSearch", "friendSearchTab");
    });

    document.getElementById("searchButton").addEventListener("click", async () => {
        const query = document.getElementById("searchInput").value.trim();
        await loadSearchResults(query);
    });

    loadFriends();
    loadFriendRequests();
}

function toggleTab(tabId, tabButtonId)
{
    document.getElementById("friendList").classList.add("d-none");
    document.getElementById("friendRequests").classList.add("d-none");
    document.getElementById("friendSearch").classList.add("d-none");
    document.getElementById(tabId).classList.remove("d-none");

    document.getElementById("friendListTab").classList.remove("active");
    document.getElementById("friendRequestTab").classList.remove("active");
    document.getElementById("friendSearchTab").classList.remove("active");
    document.getElementById(tabButtonId).classList.add("active");
}

async function getFriends()
{
    try
    {
        const response = await fetchWithAuth(`/api/users/friends/${localStorage.getItem('user_id')}/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });
        if (!response.ok)
            throw new Error("Failed to fetch friends list");
        const data = await response.json();
        return data;
    }
    catch (error)
    {
        showToast(error, "error");
        return [];
    }
}

export async function loadFriends()
{
    const friendsContainer = document.getElementById("friendsContainer");
    friendsContainer.innerHTML = "";

    const friends = await getFriends();

    if (!Array.isArray(friends) || friends.length === 0) {
        friendsContainer.innerHTML = "<p class='text-center text-muted'>No friend found.</p>";
        return;
    }

    friends.forEach(requestObj => {
        const friend = requestObj.user;
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            <div class="col d-flex align-items-center">
                <span class="badge ${friend.online_status ? 'bg-success' : 'bg-secondary'} me-2">${friend.online_status ? 'Online' : 'Offline'}</span>
                <img src="${friend.avatar}" class="rounded-circle me-2" style="width: 24px; height: 24px; object-fit: cover;" />
                <span class="username me-2" data-userid="${friend.id}">${friend.username}</span>
            </div>
            <div class="col d-flex align-items-center justify-content-end">
                <button class="btn btn-danger btn-sm remove-btn" data-id="${friend.id}">remove</button>
            </div>
        `;
        li.querySelector(".username").addEventListener("click", async () => await navigateTo(`/profile/${friend.id}/`));
        friendsContainer.appendChild(li);
    });

    // Attach event listeners to dynamically created buttons
    document.querySelectorAll(".remove-btn").forEach(button => {
        button.addEventListener("click", (event) => {
            const friendId = event.target.getAttribute("data-id");
            removeFriend(friendId);
        });
    });
}

async function getFriendRequests()
{
    try
    {
        const response = await fetchWithAuth("/api/users/friendship-requests/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!response.ok)
            throw new Error("Failed to fetch invitations.");
        const data = await response.json();
        return data;
    }
    catch (error)
    {
        showToast(error, "error");
        return [];
    }
}


export async function loadFriendRequests()
{
    const requestsContainer = document.getElementById("requestsContainer");
    requestsContainer.innerHTML = "";

    const requests = await getFriendRequests();

    if (!Array.isArray(requests) || requests.length === 0)
    {
        requestsContainer.innerHTML = "<p class='text-center text-muted'>No friend requests found.</p>";
        return;
    }

    requests.forEach(requestObj => {
        const friend = requestObj.user;
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            <div class="col d-flex align-items-center">
                <span class="badge ${friend.online_status ? 'bg-success' : 'bg-secondary'} me-2">${friend.online_status ? 'Online' : 'Offline'}</span>
                <img src="${friend.avatar}" class="rounded-circle me-2" style="width: 24px; height: 24px; object-fit: cover;" />
                <span class="username me-2" data-userid="${friend.id}">${friend.username}</span>
            </div>
            <div class="col d-flex align-items-center justify-content-end">
                <button class="btn btn-success btn-sm friend-request-accept-btn me-2" data-id="${friend.id}">accept</button>
                <button class="btn btn-danger btn-sm friend-request-decline-btn" data-id="${friend.id}">decline</button>
            </div>
        `;
        li.querySelector(".username").addEventListener("click", async () => await navigateTo(`/profile/${friend.id}/`));
        requestsContainer.appendChild(li);
    });

    // Attach event listeners to dynamically created buttons
    document.querySelectorAll(".friend-request-accept-btn").forEach(button => {
        button.addEventListener("click", (event) => {
            const friendId = event.target.getAttribute("data-id");
            acceptFriendRequest(friendId);
        });
    });

    document.querySelectorAll(".friend-request-decline-btn").forEach(button => {
        button.addEventListener("click", (event) => {
            const friendId = event.target.getAttribute("data-id");
            declineFriendRequest(friendId);
        });
    });
}

async function loadSearchResults(searchQuery)
{
    const searchContainer = document.getElementById("searchResultsContainer");
    searchContainer.innerHTML = "";

    if (!searchQuery)
    {
        searchContainer.innerHTML = "<p class='text-center text-muted'>Please enter a username to search.</p>";
        return;
    }

    try
    {
        showLoadingSpinner(true);
        const response = await fetchWithAuth(`/api/users/search-profile/?search=${encodeURIComponent(searchQuery)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });
        const users = await response.json();

        if (!response.ok)
        {
            searchContainer.innerHTML = `<p class='text-center text-danger'>${users.error || "An error occurred."}</p>`;
            return;
        }

        if (!Array.isArray(users) || users.length === 0)
        {
            searchContainer.innerHTML = "<p class='text-center text-muted'>No users found matching the search query.</p>";
            return;
        }

        users.forEach(user => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                <div class="col d-flex align-items-center">
                    <img src="${user.avatar}" class="rounded-circle me-2" style="width: 32px; height: 32px; object-fit: cover;" />
                    <span class="username me-2" data-userid="${user.id}">${user.username}</span>
                </div>
            `;
            li.querySelector(".username").addEventListener("click", async () => await navigateTo(`/profile/${user.id}/`));
            searchContainer.appendChild(li);
        });
    }
    catch (error)
    {
        console.error(error);
        searchContainer.innerHTML = "<p class='text-center text-danger'>An error occurred. Please try again later.</p>";
    }
    finally
    {
        showLoadingSpinner(false);
    }
}

