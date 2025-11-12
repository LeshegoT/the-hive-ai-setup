async function isReviewStored(id) {
  let storedReviewProgress = await getReview(id);
    return storedReviewProgress? true : false;
}

async function configureLocalStorageForReview(id) {
  let storedReviewProgress = await getReview(id);

  if(!storedReviewProgress){
    storeReview({
      assignmentId: this.externalId,
      surveyId: this.survey.id,
      answers: [],
      retrievedAt: new Date(),
    });
  }
}

function isLocalStorageOlderThanFiveMinutes(localStoredReview) {
  const FIVE_MINUTES = 5 * 60 * 1000;
  const now = new Date();
  const retrievedAt = localStoredReview?.retrievedAt ? new Date(localStoredReview.retrievedAt) : new Date();
  return now - retrievedAt > FIVE_MINUTES;
}

async function getReview(feedackassignmentId) {
  let localStoredReview = JSON.parse(localStorage.getItem(`feedback-${feedackassignmentId}`));

  if (!localStoredReview || isLocalStorageOlderThanFiveMinutes(localStoredReview)) {
    let azureReviewStoredProgress = await retrieveAzureReviewResponse(feedackassignmentId);

    if (azureReviewStoredProgress?.answers?.length > 0) {
      localStorage.setItem(
        `feedback-${feedackassignmentId}`,
        JSON.stringify({ ...azureReviewStoredProgress, retrievedAt: new Date() })
      );
      return azureReviewStoredProgress;
    }
  }

  return localStoredReview;
}

function storeReview(review) {
  localStorage.setItem(`feedback-${review.assignmentId}`, JSON.stringify(review));
  storeAzureReviewResponse(review);
}

function storeReviewAnswer(answer, feedackassignmentId) {
  let retrievedReview = JSON.parse(localStorage.getItem(`feedback-${feedackassignmentId}`));

  if (retrievedReview != null) {
    let existsingAnswerIndex = retrievedReview.answers.map((savedAnswer) => savedAnswer.id).indexOf(answer.id);

    if (existsingAnswerIndex == -1) {
      retrievedReview.answers.push(answer);
    } else {
      retrievedReview.answers[existsingAnswerIndex] = answer;
    }

    localStorage.setItem(`feedback-${feedackassignmentId}`, JSON.stringify(retrievedReview));
    storeAzureReviewResponse(retrievedReview);
  }
}

async function markReviewAsViewed(externalId) {
  return sendReviewAction('Viewed', externalId);
}

async function markReviewAsStarted(externalId) {
  return sendReviewAction('Started', externalId);
}

async function sendReviewAction(action, externalId) {
  let url = `${host}/api/review/${externalId}/action`;

  let headers = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  };

  fetch(url, headers).then((data) => {
    if (data.ok) {
      log('Action sent');
    } else {
      log('ERROR: Action not sent');
    }
  });
}

function retrieveReviewAnswer(questionId, feedackassignmentId) {
  let retrievedAnswers = JSON.parse(localStorage.getItem(`feedback-${feedackassignmentId}`));
  return retrievedAnswers?.answers.find((a) => a.id === questionId);
}

function removeSpecificFeedbackInLocalStorage(feedackassignmentId) {
  localStorage.removeItem(`feedback-${feedackassignmentId}`);
  removeAzureReviewResponse(feedackassignmentId);
}

async function storeAzureReviewResponse(review) {
 let url = `${host}/api/review/progress/${review.assignmentId}`;

  let headers = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(review),
  };

  fetch(url, headers)
    .then((data) => {
      if (data.ok) {
       log('Azure saved')
      } else {
       log('ERROR: Azure not saved');
      }
    })
}

async function retrieveAzureReviewResponse(assignmentId) {
  let url = `${host}/api/review/progress/${assignmentId}`;

  return fetch(url, { method: 'GET' })
    .then((data) => {
      if(data.ok){
        return data.json();
      }
    })
    .then((response) => {
      if (response) {
        return response;
      } else {
        return false;
      }
    });
}

async function removeAzureReviewResponse(assignmentId) {
  let url = `${host}/api/review/progress/${assignmentId}`;

  fetch(url, { method: 'DELETE' }).then((data) => {
    if (data.ok) {
      log('Azure deleted');
    } else {
      log('ERROR: Azure not deleted');
    }
  });
}
