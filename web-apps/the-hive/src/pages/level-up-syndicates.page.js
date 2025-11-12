import { html } from 'lit';
import { StatefulPage } from './stateful-page-view-element';
import { shared, animations, hex, link, form } from '../styles';
import levelUpService from '../services/level-up.service';
import { formatFullDate } from '../services/format.service';
import { selectLevelUp } from '../selectors/level-up.selectors';

import '../components/title.component';
import '../components/course-summary-group.component';
import '../components/level-up-activities.component';
import '../components/level-up-attendees.component';
import markdownService from '../services/markdown.service';
import { selectSyndicateFormationDetails, selectSyndicateFormations } from '../selectors/syndicate.selectors';
import syndicateService from '../services/syndicate.service';
import authService from '../services/auth.service';
import announcementService from '../services/announcement.service';
import config_service from '../services/config.service';

const styles = html`
  <style>
    ${shared()} ${hex()} ${animations()} ${link()} ${form()} .dates {
      display: flex;
      font-size: 1.2em;
      color: var(--app-secondary-color);
    }

    .dates > * {
      flex: 1 1 auto;
    }

    .dates > div > span {
      font-weight: bold;
    }

    .dates > div:last-child {
      text-align: right;
    }

    h3 {
      margin: 0 0 2em;
      font-size: 1.4em;
      padding: 0 2em;
      color: var(--app-secondary-color);
    }

    p {
      text-align: center;
    }

    .registration {
      margin: -1.9em 0 3em;
      text-align: right;
    }

    .registration button {
      font-size: 1em;
    }

    .buttons {
      margin-top: 2em;
    }
    :host > div {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    table {
      border: 1px solid var(--app-tertiary-color);
      border-collapse: collapse;
      margin-bottom: 1.5em;
      width: 100%;
    }
    th,
    td {
      padding: 0.25em 0.75em;
      text-align: left;
    }

    tr:nth-child(even) {
      background-color: var(--app-section-even-color);
    }

    .formation-title {
      text-align: center;
    }
    .syndicates-container {
      padding: 0;
      margin: 0;
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-evenly;
      max-width: 100%;
    }

    .ideaList {
      max-width: 30%;
      margin: 1em;
      vertical-align: top;
      background-color: #97b6d6;
      padding: 1em;
      border-radius: 0.5em;
    }

    .joinTeamButton {
      display: flex;
      justify-content: center;
    }

    .item-list {
      padding-inline-start: 0;
      min-width: 30%;
      border-radius: 0.75em;
    }

    .hero-box {
      padding: 8px 10px;
      border: solid 1px #ccc;
      margin-bottom: 5px;
      color: rgba(0, 0, 0, 0.87);
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
      background: white;
      font-size: 14px;
      border-radius: 20px;
    }
    .error {
      border: 0.1em solid var(--app-primary-color);
      box-shadow: 0.5px 0.5px 1.5px var(--app-primary-color);
    }

    @media only screen and (max-width: 900px) {
      .ideaList {
        max-width: 100%;
      }
    }
  </style>
`;

class LevelUpSyndicates extends StatefulPage {

  constructor() {
    super();
    this.idea = {
      title: '',
      description: '',
    };
  }

  hasError() {
    return this.error ? 'error' : '';
  }

  renderIdeaActions(idea) {
    return html`
      <button type="button" @click="${(_e) => this.deleteIdea(idea)}">Delete</button>
      <button type="button" @click="${(_e) => this.editIdea(idea)}">Edit</button>
    `;
  }

  renderTable() {
    if (this.formationDetails && this.formationDetails.ideas && this.formationDetails.ideas.length)
      return html`
        <section>
          <h3>Project Ideas</h3>
          <table>
            <tr>
              <th>Title</th>
              <th>Brief description</th>
              <th>Submitted by</th>
              <th>Actions</th>
            </tr>
            ${this.formationDetails.ideas.map((idea) => {
              return html`
                <tr>
                  <td>${idea.title}</td>
                  <td>${idea.description}</td>
                  <td>${idea.userSubmitted ? 'Me' : 'N/A'}</td>
                  <td>${idea.userSubmitted ? this.renderIdeaActions(idea) : ''}</td>
                </tr>
              `;
            })}
          </table>
        </section>
      `;
    return html`
      <h2>Be the first to submit an idea</h2>
    `;
  }

  refresh() {
    syndicateService.getSyndicateFormationDetails(this.levelUp.levelUpId);
  }

  deleteIdea(idea) {
    syndicateService.removeIdea(idea);
    this.refresh();
  }

  editIdea(idea) {
    this.idea = idea;
  }

  renderSubmitIdea() {
    if (this.formationDetails.userSubmissionsRemaining <= 0 && !this.idea.syndicateIdeaId)
      return html`
        <section>
          <h2>Maximum number of submissions reached</h2>
          <p>
            You have reached the maximum number of submissions permitted for this levelUp.
          </p>
        </section>
      `;

    return html`
      <section class="fade-in">
        <form @submit="${(e) => this.submit(e)}">
          <h2>${this.idea.syndicateIdeaId ? "Update Idea" : "Submit an Idea"}</h2>
          <div>
            <label>Idea Title:</label>
            <input type="text" class="${this.hasError()}" name="title" .value="${this.idea.title}" maxlength="100" />
          </div>
          <div class="description">
            <label>Description:</label>
            <textarea type="input" name="description" .value="${this.idea.description}"></textarea>
            <br />
          </div>
          <a href="https://guides.github.com/features/mastering-markdown/" target="_blank">
            (protip: this field supports markdown)
          </a>
          <button type="submit" class="save">${this.idea.syndicateIdeaId ? "Update Idea" : "Submit Idea"}</button>
        </form>
      </section>
    `;
  }

  rankIdea(ideaIndex, ideaId, rank) {
    let ideaRankChanges = [{ ideaId, newRank: rank }];
    let currentIdeaWithRankIndex = this.formationDetails.ideas.findIndex((i) => i.userIdeaRanking == rank);

    this.formationDetails.ideas[ideaIndex].userIdeaRanking = rank;

    //change value back to default if an existing idea has the same rank
    if (currentIdeaWithRankIndex >= 0) {
      this.formationDetails.ideas[currentIdeaWithRankIndex].userIdeaRanking = null;
      ideaRankChanges.push({
        ideaId: this.formationDetails.ideas[currentIdeaWithRankIndex].syndicateIdeaId,
        newRank: null,
      });
    }
    syndicateService.rankIdea(this.formationDetails.levelUpId, ideaRankChanges);
    this.requestUpdate();
  }

  renderVoteOptions(idea) {
    let options = [
      html`
        <option .selected="${!!idea.userIdeaRanking}" value="${0}">-- select --</option>
      `,
    ];
    for (let i = 1; i <= this.formationDetails.choicesAllowed; i++) {
      options.push(
        html`
          <option .selected="${idea.userIdeaRanking == i}" value="${i}">choice rank: ${i}</option>
        `
      );
    }
    return options;
  }

  renderSyndicates() {
    if (!this.syndicates) {
      return html`<h2 class="formation-title">Loading Assigned Syndicates</h2>`
    }
    const currentUser = authService.getUserPrincipleName();
    return html`
      <h2 class="formation-title">Assigned Syndicates</h2>
      <section class="syndicates-container">
        ${this.syndicates.map((project) => {
          if (project.syndicates.map((s) => s.hero).includes(currentUser)) {
            return html`
              <div class="ideaList">
                <h4 class="formation-title">${project.title}</h4>
                <p>${project.description}</p>
                <ul class="item-list">
                  ${project.syndicates.map((syndicate) => {
                    return html`
                      <li class="hero-box">${syndicate.hero}</li>
                    `;
                  })}
                </ul>
                ${project.syndicates.map((s) => s.hero).includes(currentUser) ? this.renderGitLinkInput(project) : ''}
              </div>
            `;
          } else return;
        })}
      </section>
    `;
  }

  renderJoinSyndicates() {    
    return html`
      <h2 class="formation-title">Teams To Join</h2>
      <section class="syndicates-container">
        ${this.availableTeams.map((project) => {
            return html`
              <div class="ideaList">
                <h4 class="formation-title">${project.title}</h4>
                <p>${project.description}</p>
                <p></p>
                <ul class="item-list">
                  <li class="hero-box">Join this team to see its members.</li>
                </ul>
                <div class="joinTeamButton">
                  <button type="button" @click="${async (e)=> await this.joinSyndicateTeam(project.syndicateIdeaId,e)}">Join Team</button>
                </div>
              </div>
            `;
          
        })}
      </section>
    `;
  }

  async joinSyndicateTeam(syndicateIdeaId,e) {
    if (!e.target.disabled) {
      e.target.disabled = true;
      await syndicateService.joinSyndicate(syndicateIdeaId);
      await syndicateService.getSyndicate(this.levelUp.levelUpId);
    }
  }

  renderGitLinkInput(project) {
    if (!project.gitRepo) {
      return html`
        <div>
          <label>Edit Link:</label>
          <input type="text" id="${project.syndicateIdeaId}" />
          <button type="button" @click="${this.onGitLinkInsert(project.syndicateIdeaId)}">Insert</button>
        </div>
      `;
    } else {
      return html`
        <div>
          <label>Edit Link:</label>
          <input type="text" id="${project.syndicateIdeaId}" value="${project.gitRepo}" />
          <button type="button" @click="${this.onGitLinkUpdate(project.syndicateIdeaId)}">Update</button>
        </div>
      `;
    }
  }

  onGitLinkInsert(id) {
    return async () => {
      let insertGit = this.shadowRoot.getElementById(id).value;
      if (insertGit) {
        let body = {
          gitLink: insertGit,
        };
        if (await syndicateService.submitGitLink(id, body)) {
          announcementService.createAnnouncement('none', {
            title: 'Syndicate Git Repo Link',
            body: `Git Link Inserted!`,
          });
        }
        else {
          announcementService.createAnnouncement('none', {
            title: 'Error!',
            body: `Could Not Insert Git Link`,
          });
        }
      } else {
        announcementService.createAnnouncement('none', {
          title: 'Error!',
          body: `Please Insert a Valid Git Link`,
        });
      }
    };
  }

  onGitLinkUpdate(id) {
    return async () => {
      let updateGit = this.shadowRoot.getElementById(id).value;
      if (updateGit) {
        let body = {
          gitLink: updateGit,
        };
        if (await syndicateService.submitGitLink(id, body)) {
          announcementService.createAnnouncement('none', {
            title: 'Syndicate Git Repo Link',
            body: `Git Link Updated!`,
          });
        }
        else {
          announcementService.createAnnouncement('none', {
            title: 'Error!',
            body: `Could Not Update Git Link`,
          });
        }
      } else {
        announcementService.createAnnouncement('none', {
          title: 'Error!',
          body: `Please Insert a Valid Git Link`,
        });
      }
    };
  }

  renderFormationStage() {
    switch (this.formationDetails.currentStage) {
      case 1:
        return html`
          <section>
            <h2>The syndicate formation for this levelUp is currently not active</h2>
            <p>If you believe this is a mistake, please reload the page or contact your levelUp instructor.</p>
          </section>
        `;
      case 2:
        return html`
          ${this.renderTable()} ${this.renderSubmitIdea()}
        `;
      case 3:
        return html`
          <section>
            <h3>Project Ideas Voting</h3>
            <table>
              <tr>
                <th>Title</th>
                <th>Brief description</th>
                <th>Submitted by</th>
                <th>Choice</th>
              </tr>
              ${this.formationDetails.ideas.map((idea, ideaIndex) => {
                return html`
                  <tr>
                    <td>${idea.title}</td>
                    <td>${idea.description}</td>
                    <td>${idea.userSubmitted ? 'Me' : 'N/A'}</td>
                    <td>
                      <select
                        id="${idea.syndicateIdeaId}select"
                        name="choice"
                        @change="${(e) => this.rankIdea(ideaIndex, idea.syndicateIdeaId, e.target.value)}"
                      >
                        ${this.renderVoteOptions(idea)}
                      </select>
                    </td>
                  </tr>
                `;
              })}
            </table>
          </section>
        `;
      case 4:
        return html`
          <section>
            <h2>Syndicate formation in progress</h2>
            <p>Please wait for the instructor to conclude syndicate formation. They will inform you once it is done</p>
            <p>If you believe this is a mistake, please reload the page or contact your levelUp instructor.</p>
          </section>
        `;
      case 5:
         return html`
           ${this.renderViewSyndicates()}
         `;

      default:
        return html`
          <section>
            <h2>Loading syndicate formation</h2>
          </section>
        `;
    }
  }

  renderViewSyndicates(){
      if (this.availableTeams.length) {
        return html`
          ${this.renderJoinSyndicates()}
        `;
      } else {
        return html`
          ${this.renderSyndicates()}
        `;
      }
  }

  render() {
    if (!this.levelUp) return html``;

    return html`
      ${styles}

      <section class="fade-in">
        <e-title .name="Syndicates:// ${this.levelUp.name}" .icon="${this.levelUp.icon}"></e-title>

        <p>${this.description}</p>

        <div class="dates">
          <div>
            <span>Start Date:</span>
            ${formatFullDate(this.levelUp.startDate)}
          </div>
          <div>
            <span>End Date:</span>
            ${formatFullDate(this.levelUp.endDate)}
          </div>
        </div>
        ${this.formationDetails && this.formationDetails.currentStage === 2
          ? html`
              <p>Submissions remaining: ${this.formationDetails.userSubmissionsRemaining}</p>
            `
          : html``}
      </section>
      ${this.renderFormationStage()}
    `;
  }

  firstUpdated() {
    if (!this.levelUp) {
      levelUpService.getLevelUps();
    }

    this._timerInterval = setInterval(() => {
      if (this.levelUp) {
        syndicateService.getSyndicate(this.levelUp.levelUpId);
        syndicateService.getSyndicateFormationDetails(this.levelUp.levelUpId);  
      }
    }, 
    config_service.refreshTimeout);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._timerInterval);
  }

  updated() {
    if (this.levelUp && !this.description) {
      this.description = markdownService.convertMarkdownToHtml(this.levelUp.description);
      syndicateService.getSyndicateFormationDetails(this.levelUp.levelUpId);
    }
  }

  back() {
    window.history.back();
  }

  checkAvailableTeamsToJoin() {
    let isPartOfTeam = false;
    this.availableTeams = [];
    const currentUser = authService.getUserPrincipleName();

    if (this.syndicates && this.syndicates.length > 0) {

      isPartOfTeam = this.syndicates.some((idea) => idea.syndicates && idea.syndicates.some((s) => s.hero.equalsIgnoreCase(currentUser)));
        
      if (!isPartOfTeam) {
        this.availableTeams = this.syndicates;
      }
    }
  }

  submit(e) {
    e.preventDefault();
    let form = e.target;
    let idea = {
      title: form.title.value,
      description: form.description.value,
    };

    if (idea.title != '') {
      this.error = false;
      if (this.idea.syndicateIdeaId) {
        syndicateService.updateIdea(this.idea.syndicateIdeaId, idea.title, idea.description, this.formationDetails.levelUpId);
        this.idea = {
          title: '',
          description: '',
        };
      }
      else {
        syndicateService.submitIdea(
          this.formationDetails.syndicateFormationId,
          idea.title,
          idea.description,
          this.formationDetails.levelUpId
        );
      }      
    } else {
      this.error = true;
      return;
    }
    form.reset();
  }

  static get properties() {
    return {
      levelUp: Object,
      description: String,
      availableTeams: Array,
      idea: Object,
      formationDetails: Object,
      syndicates: Array,
      error: Boolean,
    };
  }

  stateChanged(state) {
    this.levelUp = selectLevelUp(state);
    this.formationDetails = selectSyndicateFormationDetails(state);
    this.syndicates = selectSyndicateFormations(state);
    this.checkAvailableTeamsToJoin();
  }
}

window.customElements.define('e-level-up-syndicates', LevelUpSyndicates);
