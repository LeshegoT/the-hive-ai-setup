import { html, LitElement } from 'lit';
import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin';
import { star } from '../components/svg';
import { shared } from '../styles';
import content_tags_service from '../services/content_tags.service';
import content_ratings_service from '../services/content_ratings.service';
import { selectRatings } from '../selectors/ratings.selector.js';
import { selectTagSearchOptions } from '../selectors/tags.selector';
import configService from '../services/config.service';

let styles = html`
<style>
  ${shared()} textarea {
    width: 100%;
    height: 5em;
    font-size: 1.1em;
  }

  .error {
    border: 0.1em solid var(--app-primary-color);
    box-shadow: 0.5px 0.5px 1.5px var(--app-primary-color);
  }

  em {
    color: black;
  }

  input {
    margin: 0 0.5em;
    border: none;
    border-bottom: 1px solid var(--app-tertiary-color);
    font-size: 1em;
    color: var(--app-tertiary-color);
  }

  button.add-tag {
    align-self: flex-start;
  }

  .info {
    display: flex;
    flex-direction: column;
  }

  .info > span {
    flex: 1 1 0;
    margin: 1em 0;
  }

  input.tag {
    width: inherit;
  }

  .rating-checked > svg {
    fill: orange;
  }

  .unchecked {
    fill: silver;
  }

  .highlight {
    stroke: orange;
  }

  .tags {
    display: flex;
    justify-content: left;
    flex-wrap: wrap;
    width: 100%;
  }

  .tags ul {
    display: flex;
    flex-wrap: wrap;
    padding: 0.44em;
  }

  .tags ul li {
    color: var(--app-dashboard-color);
    margin: 0.25em 0.19em;
    list-style: none;
    border-radius: 0.31em;
    background: var(--app-dashboard-shadow);
    padding: 0.31em 0.5em 0.31em 0.6em;
    border: 0.06em solid var(--app-dashboard-shadow);
    display: flex;
    justify-content: center;
  }

  .tags ul li i {
    height: 1.25em;
    width: 1.25em;
    color: var(--app-tertiary-color);
    margin-left: 0.5em;
    font-size: 0.75em;
    cursor: pointer;
    border-radius: 50%;
    background: var(--app-dashboard-background);
    justify-content: center;
  }

  @media (min-width: 460px) {
    .info {
      flex-direction: row;
    }
    input.tag {
      width: 20em;
    }
  }
  </style>
`;

class RateContent extends connect(store)(LitElement) {
  
  tags = [];
  tagToAdd = '';
  errors = [];

  hasError(name) {
    return this.errors.indexOf(name) >= 0;
  }

  render() {
    if (!configService.config.RATING_CONTENT_ENABLED || !configService.config.TAG_CONTENT_ENABLED) {
      return html``;
    } else {
    return html`
      ${styles}
      <div class="info">
        ${this.renderContentRating()}
        ${this.renderContentTags()}
      </div>
    `;
    }
  }

  renderContentRating() {
    return html`
      <span>
        Rate this content:
        <div class="rating ${this.hasError('rating') ? 'error' : ''}">
          ${this.renderRating()}
        </div>
      </span>
    `;
  }

  renderRating() {
    if (!this.ratingIds) {
      return html``;
    }

    let content = this.ratingIds.map((e, i) =>
      html`
        <span 
          class="button star ${this.rating > i ? 'rating-checked' : 'unchecked'} ${this.shouldHighlight(i)}"
          @click="${(e) => this.updateRating(i + 1)}"
          @mouseover="${(e) => this.hoverOverRating(i)}"
          @mouseout="${(e) => this.cancelHover()}"
        >
          ${star}
        </span>
      `
    )
    return html`
      ${content}
    `;
  }

  updateRatingValueIds(ratingValues) {
    if (!this.ratingIds) {
      ratingValues.sort((a, b) => {
        if ( a.score < b.score ){
          return -1;
        }
        if ( a.score > b.score ){
          return 1;
        }
        return 0;
      });
      let newIds = ratingValues.map((ratingValue) => ratingValue.ratingValueId);
      if (newIds.length) {
        this.ratingIds = newIds;
      }
    }
  }

  hoverOverRating(index) {
    this.ratingHighlights = index + 1;
  }

  shouldHighlight(index) {
    if (index + 1 <= this.ratingHighlights) {
      return 'highlight';
    }

    return '';
  }

  cancelHover() {
    this.ratingHighlights = 0;
  }

  updateRating(index) {
    this.rating = index;
    let event = new CustomEvent('rating-changed', { detail: { ratingId: this.getRatingId() } });
    this.dispatchEvent(event);
  }

  addTag() {;
    let tagElement = this.shadowRoot.getElementById('new-tag');
    if (!tagElement.value || this.tags.find((tag) => tag.tagName == tagElement.value)) {
      return;
    }
    let tag = this.tagSearchOptions.find((tag) => tag.tagName == tagElement.value);
    if (!tag) {
      tag = {tagName: tagElement.value};
    }
    this.tags.push(tag);
    this.requestUpdate();
    tagElement.value = '';
    let event = new CustomEvent('tags-changed', { detail: { tags: this.tags } });
    this.dispatchEvent(event);
  }

  renderContentTags() {
    return html`
      <span>
        Tag this content:
        <input
          class="${this.hasError('tags') ? 'error' : ''}"
          type="text"
          list="search-tags"
          name="new-tag"
          id = "new-tag"
          class="tag"
          placeholder="tag"
        />
        <datalist id="search-tags">
          ${this.renderTagOptions()}
        </datalist>
        <button type="button" class="add-tag big" @click="${(e) => this.addTag()}">
          Add
        </button>
        <div class="tags">
          ${this.renderDisplayTags()}
        </div>
      </span>
    `;
  }

  renderTagOptions() {
    if (!this.tagSearchOptions) {
      return html``;
    }
    let options = this.tagSearchOptions.map((tag) =>
      html`
        <option value="${tag.tagName}">
      `);
    return  html`${options}`;
  }

  renderDisplayTags() {
    return html`
      <div class="tags-container">
        <ul>
          ${this.tags.map((tag, indx) => this.renderTag(tag, indx))}
        </ul>
      </div>
    `;
  }

  removeTag(indx) {
    this.tags.splice(indx, 1);
    this.requestUpdate();
    let event = new CustomEvent('tags-changed', { detail: { tags: this.tags } });
    this.dispatchEvent(event);
  }

  renderTag(tag, indx) {
    return html`
      <li>
        <div class="tag-name">${tag.tagName}</div>
        <span @click=${(e) => this.removeTag(indx)}>
          <i>X</i>
        </span>
      </li>
    `;
  }

  reset() {
    this.tags = [];
    this.rating = 0;
  }

  getRatingId() {
    return this.ratingIds[this.rating - 1];
  }

  isValid() {
    let errors = [];

    if (!this.rating) {
      errors.push('rating');
    }

    if (!this.tags.length) {
      errors.push('tags');
    }

    this.errors = [...errors];
    this.requestUpdate();

    return !errors.length;
  }

  static get properties() {
    return {
      errors: Array,
      rating: Number,
      tags: Array,
      ratingHighlights: Number,
      ratingIds: Array,
      tagSearchOptions: Array
    };
  }

  firstUpdated(){
    content_tags_service.getTags();
    content_ratings_service.getRatingValues();
  }

  stateChanged(state) {
    this.updateRatingValueIds(selectRatings(state)) 
    this.tagSearchOptions = selectTagSearchOptions(state)
  }
}

window.customElements.define('e-rate-content', RateContent);
