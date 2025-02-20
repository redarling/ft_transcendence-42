import removeFriend from "../users/friends_management/removeFriend.js";
import acceptFriendRequest from "../users/friends_management/acceptFriendRequest.js";
import declineFriendRequest from "../users/friends_management/declineFriendRequest.js";
import renderUserProfile from "./profile.js";
import navigateTo from "../navigation/navigateTo.js";
import { fetchWithAuth } from "../utils/fetchWithAuth.js";

export default function renderFriends()
{
    console.log("- function: renderFriends()");
    const main = document.getElementById("main");

    main.innerHTML = `
        <div class="container mb-5" style="padding-top: 25px; max-width: 600px; margin: 0 auto;">
            <h1 class="text-center">Friends</h1>
            <p class="text-muted text-center">Manage your friends and requests below:</p>

            <ul class="nav nav-tabs" id="friendTabs">
                <li class="nav-item">
                    <a class="nav-link active" id="friendListTab" href="#">Friends</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="friendRequestTab" href="#">Requests</a>
                </li>
            </ul>

            <div id="friendList" class="friend-content">
                <ul id="friendsContainer" class="list-group mt-3"></ul>
            </div>
            <div id="friendRequests" class="friend-content d-none">
                <ul id="requestsContainer" class="list-group mt-3"></ul>
            </div>

            <button class="btn btn-secondary w-100 mt-3" id="returnFriends">Return</button>
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
    document.getElementById("returnFriends").addEventListener("click", () => navigateTo("/settings"));

    loadFriends();
    loadFriendRequests();
}

function toggleTab(tabId, tabButtonId)
{
    document.getElementById("friendList").classList.add("d-none");
    document.getElementById("friendRequests").classList.add("d-none");
    document.getElementById(tabId).classList.remove("d-none");

    document.getElementById("friendListTab").classList.remove("active");
    document.getElementById("friendRequestTab").classList.remove("active");
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
        console.error("Error fetching friends list:", error);
        return [];
    }
}

async function loadFriends()
{
    const friendsContainer = document.getElementById("friendsContainer");
    friendsContainer.innerHTML = "";

    const friends = await getFriends();

    friends.forEach(friend => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            <img src="${friend.avatar}" class="avatar-small"> 
            <span class="username" data-userid="${friend.id}">${friend.username}</span>
            <span class="badge ${friend.online_status ? 'bg-success' : 'bg-secondary'}">${friend.online_status ? 'Online' : 'Offline'}</span>
            <button class="btn btn-danger btn-sm" onclick="removeFriend('${friend.id}')">&times;</button>
        `;
        li.querySelector(".username").addEventListener("click", () => navigateTo(`/profile/${friend.id}/`));
        friendsContainer.appendChild(li);
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
            throw new Error("Failed to fetch friend requests");
        const data = await response.json();
        return data;
    }
    catch (error)
    {
        console.error("Error fetching friend requests:", error);
        return [];
    }
}

async function loadFriendRequests()
{
    const requestsContainer = document.getElementById("requestsContainer");
    requestsContainer.innerHTML = "";

    const requests = await getFriendRequests();

    requests.forEach(requestObj => {
        const friend = requestObj.friend;
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            <img src="${friend.avatar}" class="avatar-small"> 
            <span class="username" data-userid="${friend.id}">${friend.username}</span>
            <span class="badge ${friend.online_status ? 'bg-success' : 'bg-secondary'}">${friend.online_status ? 'Online' : 'Offline'}</span>
            <div class="d-flex gap-2">
                <button class="btn btn-success btn-sm accept-btn" data-id="${friend.id}">v</button>
                <button class="btn btn-danger btn-sm decline-btn" data-id="${friend.id}">&times;</button>
            </div>
        `;
        li.querySelector(".username").addEventListener("click", () => navigateTo(`/profile/${friend.id}/`));
        requestsContainer.appendChild(li);
    });

    // Attach event listeners to dynamically created buttons
    document.querySelectorAll(".accept-btn").forEach(button => {
        button.addEventListener("click", (event) => {
            const friendId = event.target.getAttribute("data-id");
            acceptFriendRequest(friendId);
        });
    });

    document.querySelectorAll(".decline-btn").forEach(button => {
        button.addEventListener("click", (event) => {
            const friendId = event.target.getAttribute("data-id");
            declineFriendRequest(friendId);
        });
    });
}
