export default function readyUpToast()
{
    const toastContainer = document.getElementById("toast-container");
    const toastHTML = `
        <div id="readyup-toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">Your match is ready!</strong>
            </div>
            <div class="toast-body">
                <button id="readyup-btn" type="button" class="btn btn-success btn-sm">Ready</button>
            </div>
        </div>
    `;
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
}
