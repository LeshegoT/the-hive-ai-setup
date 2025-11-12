let externalId = '';
let host = '';

window.addEventListener('load', async function () {
  const urlParams = new URLSearchParams(window.location.search);
  this.externalId = urlParams.get('id');
  this.host = window.location.origin;

  let response = await getReviewBasicInformation(this.host, this.externalId);
  renderAnnouncement(response)
});



async function getReviewBasicInformation(host, id) {
  let url = `${host}/api/external/${id}/status`;

  return fetch(url, { method: 'GET' })
    .then((data) => {
      return data.json();
    })
    .then((reviewInformation) => {
      return reviewInformation;
    });
}

function renderAnnouncement(announcement){
    const container = document.getElementById('deniedContainer');

    if(announcement.status === 'Completed'){
        container.innerHTML += `
            <p>
                <h2 class="large-label">You have already completed the review for BBD Employee:</h2>
                <label class="large-subtext-label" id="reviewee">${announcement.reviewee}</label>
            </p>
            <h1 class="xlarge-heading">Thank you for your valued feedback! </h1>
        `;
    } else if(announcement.status === 'Deleted') {
        container.innerHTML += `
            <p>
                <h2 class="large-label">Link No Longer Valid</h2>
                <label class="large-subtext-label">Our HR department no longer requires your feedback. Thank you for checking in. We apologise for the inconvenience.</label>
                <label class="small-subtext-label">You may now close this window.</label>
            </p>
        `;
    } else {
        container.innerHTML += `
            <h1 class="xlarge-heading">Access Denied</h1>
            <p>
                <h2 class="large-label">You no longer have access to this review because it has passed it’s due date or the link has expired.</h2>
                <label class="medium-subtext-label" id="reviewee">Please contact <label class="warning">hr@bbdsoftware.com</label> to regain access to this review.</label>
            </p>
        `;

    }

}