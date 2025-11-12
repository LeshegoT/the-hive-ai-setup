let externalId = '';
let host = '';

window.addEventListener('load', async function() {
  const urlParams = new URLSearchParams(window.location.search);
  this.externalId = urlParams.get('id');
  this.host = window.location.origin;


  let response = await getReviewBasicInformation(this.host, this.externalId);
  if (response.reviewee){
    document.getElementById('reviewee').innerText = response.reviewee;
  } 

  const backButton = document.getElementById('backToReviewButton');
  if(backButton){
    backButton.addEventListener('click', function () {
      navigateToReview()
    });
  }

});

function navigateToReview(){
  window.location.replace(`/?id=${this.externalId}`);
}

async function getReviewBasicInformation(host, id) {
  let url = `${host}/api/external/${id}`;

  return fetch(url, { method: 'GET' })
    .then((data) => {
      return data.json();
    });
}
