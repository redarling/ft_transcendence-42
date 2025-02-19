export default function matchRecoveryToast()
{
    const toastContainer = document.getElementById("toast-container");
    const toastHTML = `
        <div id="match-ongoing-toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">You have an active match ongoing!</strong>
            </div>
            <div class="toast-body">
                <button id="restore-match-btn" type="button" class="btn btn-primary btn-sm">Back to the match</button>
            </div>
        </div>
    `;
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
}
