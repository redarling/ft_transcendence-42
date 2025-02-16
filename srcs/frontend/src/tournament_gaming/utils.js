export function AreYouSureModal()
{
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header d-flex justify-content-center align-items-center">
                <h5 class="modal-title">Are you sure?</h5>
            </div>
            <div class="modal-body d-flex justify-content-center">
                <button type="button" class="btn btn-success" id="yesBtn">Yes</button>
                <button type="button" class="btn btn-danger" id="noBtn" style="margin-left: 10px;">No</button>
            </div>
        </div>
    `;
    return modal;
}