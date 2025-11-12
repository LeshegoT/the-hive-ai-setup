const REVIEW_SECTION_TITLE = 'Review';
const NEXT_NAVIGATION = 'next';
const PREVIOUS_NAVIGATION = 'previous';

let externalId = '';
let host = '';
let reviewee = '';
let questions = [];
let sections = [];
let currentSection;
let answers = [];
let formattedDate = '';

window.addEventListener('load', async function () {
  const urlParams = new URLSearchParams(window.location.search);
  this.externalId = urlParams.get('id');
  this.host = window.location.origin;
  let hideTutorial = await isReviewStored(this.externalId);

  let survey = await getReviewSurvey(this.host, this.externalId);
  this.questions = survey.questions;
  this.reviewee = survey.reviewee;

  const dueDate = new Date(survey.deadline);
  this.formattedDate = `${dueDate.getDate()} ${dueDate.toLocaleString('default', { month: 'long' })} ${dueDate.getFullYear()}`;
  renderReviewHeader(); 

  configureSections();
  renderProgressStepper();
  configureTutorial(survey);
  toggleReviewState(hideTutorial);

  markReviewAsViewed(this.externalId);
});

function toggleReviewState(hideTutorial){
  const survey = document.getElementById("survey");
  const tutorial = document.getElementById('tutorial');
  if (hideTutorial){
    survey.style['display'] = 'flex';
    tutorial.style['display'] = 'none';
    configureLocalStorageForReview(this.externalId);
    markReviewAsStarted(this.externalId);
  }
  else{
    survey.style['display'] = 'none';
    tutorial.style['display'] = 'flex';
  }
}

function renderReviewHeader(){
  const revieweeInformationHeader = document.getElementById('reviewHeaderReviewee');
  revieweeInformationHeader.innerHTML = this.reviewee;

  const dueDateInformationHeader = document.getElementById('reviewHeaderDueDate');
  dueDateInformationHeader.innerHTML += `
    <img class="tutorialIcon" src="../images/calendar.svg" />
    <p>
      You have until
      <b class="redText">
        ${this.formattedDate}
      </b>
      to complete this.
    </p>
    `;

}

document.getElementById('survey').addEventListener('focusout', saveProgress.bind(this));

function renderProgressStepper(){
  let isCompleted = true;
  const progressStepper = document.getElementById('progressStepper');
  progressStepper.innerHTML = ``;
  this.sections.map((section, index) => {
    let stepAppearanceClass;
    if (section.name.toLowerCase() == this.currentSection.name.toLowerCase()) {
      stepAppearanceClass = 'currentStep';
      isCompleted = false;
    } else if (isCompleted) {
      stepAppearanceClass = 'completedStep';
    } else {
      stepAppearanceClass = 'defaultStep';
    }
    progressStepper.innerHTML += `
          <section class="linesAndSteps">
            ${index == 0 ? '' : `<section class="line"></section>`}
            <section class="singleStep">
              <section class=${stepAppearanceClass}>${isCompleted ? '' : index + 1}</section>
              <label class="stepName">${section.name}</label>
            </section>
          </section>
        `;
  });

  progressStepper.scrollLeft = scrollToCurrentStep(progressStepper.scrollWidth);
}

function scrollToCurrentStep(totalWidth){
  let totalSections = this.sections.length;
  let currentSection = this.sections.findIndex((section) => section.name == this.currentSection.name);
  return (totalWidth / totalSections) * currentSection;
}

document.getElementById('submitButton').addEventListener('click', function () {
  submitReview();
});

document.getElementById('saveAndContinueButton').addEventListener('click', function () {
  let answer = saveProgress();
  let validSave = isSaveValid(answer);

  if (validSave) {
    navigateToSection(NEXT_NAVIGATION);
  }
});

document.getElementById('previousButton').addEventListener('click', function () {
  let answer = saveProgress();
  let validSave = isSaveValid(answer);
  navigateToSection(PREVIOUS_NAVIGATION);
});

document.getElementById('saveForLaterButton').addEventListener('click', function () {
  saveProgress();
  const urlParams = new URLSearchParams(window.location.search);
  window.location.replace(`saveForLater/?id=${urlParams.get('id')}`);

});




async function  getReviewSurvey(host, id) {
  let url = `${host}/api/survey/?id=${id}`;

  return fetch(url, { method: 'GET' })
    .then((data) => {
      return data.json();
    })
    .then((survey) => {
      return survey;
    });
}

function configureSections() {
  this.sections = this.questions.map((question, index) => ({
    name: question.name,
    next: index + 1 < this.questions.length ? this.questions[index + 1].name : REVIEW_SECTION_TITLE,
  }));

  this.sections.push({
    name: REVIEW_SECTION_TITLE,
  });

  Object.freeze(this.sections);
  this.currentSection = this.sections[0];

  for (let question of this.sections) {
    createSectionHeading(question);
  }

  for (let question of this.questions) {
    createQuestionSection(question);
  }

  document.getElementById('surveyQuestion').innerHTML += `<section class='hidden' id="reviewSummary">`;

  showSectionContent();
}

function configureTutorial(survey){
    const tutorialSection = document.getElementById('tutorial');
    let startButton = tutorialSection.innerHTML;
     tutorialSection.innerHTML = `
        <h2 class="large-subtext-label">${survey.feedbackType} Review:</h2>
        <h1 class="xlarge-heading">BBD Employee Review</h1>
        <section id="tutContainer">
          <section class="explanation">
            <p>The BBD Client/Colleague 360&deg; feedback review is a process in which our employees receive feedback at their annual
            review. An important part of this feedback process is ensuring you, our client, can comment and provide input.</p>
          </section>
          <section class="paragraph">
            <section class="sentence">
              <img class="tutorialIcon" src="../images/suitcase.svg" />
              <p>
                We would like your feedback on our BBD employee:
                <b>${this.reviewee}</b>.
              </p>
            </section>
            <section class="sentence">
              <img class="tutorialIcon" src="../images/calendar.svg" />
              <p>
                You have until
                <b class="redText">
                   ${this.formattedDate}
                </b>
                to complete this review.
              </p>
            </section>
            <section class="sentence">
              <img class="tutorialIcon" src="../images/submit.svg" />
              <p>
                Remember to click the
                <b>SUBMIT button</b>
                when you're done.
              </p>
            </section>
          </section>
        </section>
        
        `;
        tutorialSection.innerHTML += startButton;
  document.getElementById('startButton').addEventListener('click', function () {toggleReviewState(true);});
}

function hideElement(elementName) {
  const element = document.getElementById(elementName);
  element.classList.add('hidden');
}

function showElement(elementName) {
  const element = document.getElementById(elementName);
  element.classList.remove('hidden');
}

function createSectionHeading(question) {
  const surveyHeaderSection = document.getElementById('surveyHeaders');

  surveyHeaderSection.innerHTML += `
        <h2 class="large-heading sectionTitle hidden" id="heading-${question.name}">
          ${question.name}
        </h2>
        `;
}

function createQuestionSection(question) {
  switch (question.type) {
    case 'extended-rating':
      createQuestionSectionExtendedRating(question);
      break;
    case 'rating-only':
      createQuestionSectionRatingOnly(question);
      break;
    default:
      createQuestionSectionStandardAnswer(question);
  }
}

function createQuestionSectionExtendedRating(question) {
  const container = document.getElementById('surveyQuestion');
  let answer = retrieveReviewAnswer(question.id, this.externalId);

  container.innerHTML += `
    <section class="hidden" id="section-${question.id}">
      <label class="medium-label mainQuestion">${question.question}</label>
      <div class="sectionRatingContainer">
      <label id="rating-error-${question.id}" class="warning hidden errorMessage">* This field is required</label>
          ${createRatingScale(question, answer)}
      </div>
        
          <label class="medium-label mainQuestion">
            Do you have any positive comments for ${this.reviewee} regarding ${question.name}?
          </label>
          <label id="positive-error-${question.id}" class="warning hidden errorMessage">* This field is required</label>
          <textarea
            name="positiveComment"
            class="reviewComment"
            id="positiveComment-${question.id}"
            placeholder="Add your Comments..."
          value=${answer?.positiveComment ? answer.positiveComment : ''}
          >${answer?.positiveComment ? answer.positiveComment : ''}</textarea>
           <p class="xxsmall-subtext-label wordCounter" id="wordCount-positiveComment-${question.id}"></p>
          <label class="medium-label mainQuestion">
            Do you have any constructive comments for ${this.reviewee} regarding ${question.name}?
          </label>
          <label id="constructive-error-${question.id}" class="warning hidden errorMessage">* This field is required</label>
          <textarea
            name="constructiveComment"
            class="reviewComment"
            id="constructiveComment-${question.id}"
            placeholder="Add your Comments..."
            value=${answer?.constructiveComment ? answer.constructiveComment : ''}
          >${answer?.constructiveComment ? answer.constructiveComment : ''}</textarea>
          <p class="xxsmall-subtext-label wordCounter" id="wordCount-constructiveComment-${question.id}"></p>
      </section>
  `;


  document.getElementById(`wordCount-positiveComment-${question.id}`).innerHTML = wordCounter(document.getElementById(`positiveComment-${question.id}`).value);
  document.getElementById(`wordCount-constructiveComment-${question.id}`).innerHTML = wordCounter(document.getElementById(`constructiveComment-${question.id}`).value);

}

document.addEventListener('keyup', (event) => {
  let wordCountElement =  document.getElementById(`wordCount-${event.target.id}`) ;

  if (wordCountElement) {
    let elementText = event.target.value;
    wordCountElement.innerHTML = wordCounter(elementText);
  }
});

function wordCounter(sentence){
  const allowedRegex = /[a-zA-Z]/;
  let splitSentence = sentence.split(' ');
  
  let count = splitSentence.filter((word) => allowedRegex.test(word)).length;
  let word = count == 1 ? 'word' : 'words';
  return `${count} ${word}`;
}

function createQuestionSectionStandardAnswer(question) {
  const container = document.getElementById('surveyQuestion');
  let answer = retrieveReviewAnswer(question.id, this.externalId);

  container.innerHTML += `
    <section class='hidden' id="section-${question.id}">
          <label class="medium-label mainQuestion">${question.name}</label>
          <label class="small-subtext-label subQuestionText">${question.question}</label>
          <label id="general-error-${question.id}" class="warning hidden errorMessage">* This field is required</label>
                <textarea
                  name="generalComment"
                  class="reviewComment"
                  id="generalComment-${question.id}"
                  placeholder="Add your Comments..."
                  value=${answer?.generalComment}
                >${answer?.generalComment}</textarea>
    </section>
  
  
  `;
}

function createQuestionSectionRatingOnly(question) {
  const container = document.getElementById('surveyQuestion');
  let answer = retrieveReviewAnswer(question.id, this.externalId);

  container.innerHTML += `
    <section class='hidden' id="section-${question.id}">
      <label class="medium-label mainQuestion">${question.question}</label>
      <div class="sectionRatingContainer">
      <label id="rating-error-${question.id}" class="warning hidden errorMessage">* This field is required</label>
          ${createRatingScale(question, answer)}
      </div>
      </section>
  
  
  `;
}

function createRatingScale(question, answer) {
  return question.scale.map((rating) => {
    return `
            <div class='ratingOption'>
              <input
                type="radio"
                class="sectionRating"
                id="radio-${rating.rating}-${question.id}-${this.externalId}"
                name="radio-${question.id}-${this.externalId}"
                data-description="${rating.description}"
                value="${rating.rating}"
                ${answer?.rating.rating == rating.rating ? `checked` : ``}
              />
              <label class="small-subtext-label subQuestionText" for="radio-${rating.rating}-${question.id}-${this.externalId}">
                ${rating.description}
              </label>
            </div>
          `;
  }).join(' ');
}

function showSectionContent() {
  showPreviousButton();
  showSaveAndContinueButton();
  showSubmitButton();
  showQuestionSection();
}

function showQuestionSection() {
  for (let question of this.questions) {

    if (question.name == this.currentSection.name) {
      showElement(`section-${question.id}`);
      showElement(`heading-${question.name}`);
    } else {
      hideElement(`section-${question.id}`);
      hideElement(`heading-${question.name}`);
    }
  }


  if (this.currentSection.name == REVIEW_SECTION_TITLE) {
    showElement(`reviewSummary`);
    showElement(`heading-${REVIEW_SECTION_TITLE}`);
    updateRemoveSummaryContent();
  } else {
    hideElement(`reviewSummary`);
    hideElement(`heading-${REVIEW_SECTION_TITLE}`);
  }
}

async function updateRemoveSummaryContent() {
  let reviewSection = document.getElementById(`reviewSummary`);
  let review = await getReview(this.externalId);

    reviewSection.innerHTML = `
    <div class="xsmall-subtext-label" id="informationBanner">
      <img src="./images/information.svg" class="icon" />
        <p><b>Note</b>: Your answers to these sections are editable until you select submit. Please verify that you are happy with
        your input.</p>
      </div>

      <label class="medium-label" id="revieweeInformation">Your answers for <b>${this.reviewee}</b> are as follows: </label>

      ${review.answers
        .map((answer) => {
          return `
        <div class="answerSection">
        <span>
          ${this.renderRating(answer)}
        </span>
        <section class="commentSection">
          <div>
              <label class="medium-subtext-label commentName">Positive Comment</label>
              <label class="xsmall-subtext-label comment">${answer.positiveComment}</label>
            </div>
            <div>
              <label class="medium-subtext-label commentName">Constructive Comment</label>
              <label class="xsmall-subtext-label comment">${answer.constructiveComment}</label>
            </div>
        </section>
        <section class="editSummarySection">
          <button class="blackLinedButton editButton" data-question-name="${answer.name}">
             <img src="../images/edit.svg" />
             Edit
          </button>
        </section>
      </div>
        `;
        })
        .join(' ')}
  `;

    let editButtons = document.getElementsByClassName('editButton');

    Array.from(editButtons).forEach(function (element) {
      element.addEventListener('click', (event) =>{
        let question = event.target.getAttribute("data-question-name");
        if(question){
          navigateToSection(question);
        }
      });
    });



}

function renderRating(answer){
   let percentage = ((answer.rating.rating / answer.rating.total) * 100).toFixed(2);
  return `
    <div class="ratingAnswer">
      <div>
        <label class="medium-heading ratingQuestionName">${answer.name}</label>
        <div class="progressBar">
          <div id="progressTotal">
            <div style="width:${percentage}%" id="precentageComplete"></div>
          </div>
          <label class="small-heading">${answer.rating.rating}</label>
        </div>
      </div>
      <div class="small-subtext-label ratingDescription">${answer.rating.description}</div>
    </div>
  `;
}

function showPreviousButton() {
  let previousSection = this.sections.find((section) => section.next == this.currentSection.name);

  if (this.currentSection.name !== REVIEW_SECTION_TITLE && previousSection ) {
    showElement('previousButton');
  } else {
    hideElement('previousButton');
  }
}

function showSaveAndContinueButton() {
  if (this.currentSection.next) {
    showElement('saveAndContinueButton');
  } else {
    hideElement('saveAndContinueButton');
  }
}

function showSubmitButton() {
  if (this.currentSection.next) {
    hideElement('submitButton');
    hideElement('recaptcha-container');
  } else {
    showElement('submitButton');
    showElement('recaptcha-container');
  }
}

function navigateToSection(sectionNavigation) {
  let nextSection;

  switch (sectionNavigation) {
    case NEXT_NAVIGATION:
      nextSection = this.currentSection.next;
      break;
    case PREVIOUS_NAVIGATION:
      nextSection = this.sections.find((s) => s.next == this.currentSection.name).name;
      break;
    default:
      nextSection = this.sections.find((s) => s.name == sectionNavigation).name;
      break;
  }

  this.currentSection = this.sections.find((section) => section.name == nextSection);
  this.showSectionContent();
  renderProgressStepper();
}

function saveProgress() {
  if(this.currentSection.name != REVIEW_SECTION_TITLE){
    let currentQuestion = this.questions.find((q) => q.name == this.currentSection.name);
    let selectedRatingElement = document.querySelector(
      `input[name="radio-${currentQuestion.id}-${this.externalId}"]:checked`
    );

    let selectedRating = {
      rating: selectedRatingElement?.value,
      description: selectedRatingElement?.getAttribute('data-description'),
      total: currentQuestion.scale.length,
    };

    let questionAnswer = {
      id: currentQuestion.id,
      name: currentQuestion.name,
      type: currentQuestion.type,
      constructiveComment: document.getElementById(`constructiveComment-${currentQuestion.id}`)?.value.trim(),
      positiveComment: document.getElementById(`positiveComment-${currentQuestion.id}`)?.value.trim(),
      generalComment: document.getElementById(`generalComment-${currentQuestion.id}`)?.value.trim(),
      rating: selectedRating,
    };

    storeReviewAnswer(questionAnswer, this.externalId);
    return questionAnswer;
  }

}

function isSaveValid(answer) {
  if (this.currentSection.name != REVIEW_SECTION_TITLE) {
    let currentQuestion = this.questions.find((q) => q.name == this.currentSection.name);

    if (currentQuestion.type == 'extended-rating') {
      let requiredAnswers = [answer.rating.rating, answer.positiveComment.trim(), answer.constructiveComment.trim()];

      indicateIncompleteAnwer(requiredAnswers[0], currentQuestion.id, 'rating');
      indicateIncompleteAnwer(requiredAnswers[1], currentQuestion.id, 'positive');
      indicateIncompleteAnwer(requiredAnswers[2], currentQuestion.id, 'constructive');

      return requiredAnswers.every((answer) => answer);
    } else if (currentQuestion.type == 'rating-only') {
      indicateIncompleteAnwer(answer.rating.rating, currentQuestion.id, 'rating');
      return answer.rating.rating;
    } else {
      indicateIncompleteAnwer(answer.generalComment.trim(), currentQuestion.id, 'general');
      return answer.generalComment.trim();
    }
  }
}

function indicateIncompleteAnwer(answer, id, type){
  let element = document.getElementById(`${type}-error-${id}`);
  if (answer) {
    element.style.display = 'none';
  } else {
    element.style.display = 'block';
  }
}


async function submitReview() {
   const submitButton = document.getElementById('submitButton');
   submitButton.disabled = true;

  let review = await getReview(this.externalId);
  let recaptcha = grecaptcha.getResponse();


  

  if (recaptcha.length == 0) {
    this.showElement('captcha-error');
    submitButton.disabled = false;
  } else {
    this.hideElement('captcha-error');
    this.hideElement('submit-error');

    let url = this.host + '/api/external/' + this.externalId;

    let headers = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recaptcha: recaptcha,
        review: review ,
      }),
    };

    fetch(url, headers)
      .then((data) => {
        if (data.ok) {
          removeSpecificFeedbackInLocalStorage(this.externalId)
          window.location.replace(`/success/?id=${this.externalId}`);
        }else{
          submitButton.disabled = false;
          this.showElement('submit-error');
        }
      }).catch((error)=>{
        submitButton.disabled = false;
        this.showElement('submit-error');
      });

  }

}


function chaptchaChanged() {
  const submitButtonElement = document.getElementById('submitButton');
  const captchaErrorElement = document.getElementById('captcha-error');
  if (recaptcha.length == 0) {
    captchaErrorElement.classList.remove('hidden');
    submitButtonElement.setAttribute('disabled', 'disabled');
  } else {
    captchaErrorElement.classList.add('hidden');
    submitButtonElement.removeAttribute('disabled');
  }
}