export default function showToast(message, type)
{
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.className = "btn-close";
    closeButton.textContent = "×";
    closeButton.onclick = () => toast.remove();

    toast.appendChild(messageSpan);
    toast.appendChild(closeButton);

    const toastContainer = document.getElementById("toast-container");
    toastContainer.appendChild(toast);

    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.remove();
        }
    }, 3500);
}