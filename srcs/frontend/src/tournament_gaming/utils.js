export function showToast(message, type)
{
    console.log("Message:", message);

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

    document.body.appendChild(toast);

    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.remove();
            console.log("Toast removed after timeout");
        }
    }, 3000);
}

const style = document.createElement('style');
style.innerHTML = `
.custom-toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 10px 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 9999;
    animation: fadeIn 0.3s ease-in-out;
    font-size: 14px;
}

.custom-toast.success {
    border-color: green;
    color: green;
}

.custom-toast.error {
    border-color: red;
    color: red;
}

.custom-toast .btn-close {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
}

.custom-toast .btn-close:hover {
    color: red;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;
document.head.appendChild(style);