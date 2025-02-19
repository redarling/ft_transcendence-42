export default function bracketRecoveryToast()
{
    const toastContainer = document.getElementById("toast-container");
    const toastHTML = `
        <div id="tournament-ongoing-toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">You have an active tournament ongoing!</strong>
            </div>
            <div class="toast-body">
                <button id="restore-bracket-btn" type="button" class="btn btn-primary btn-sm">Back to the bracket</button>
            </div>
        </div>
    `;
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
}
