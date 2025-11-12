import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';

const styles = html`
  <style>
  ${reviewShared()}
    p {
      color: #64748B;
      text-align: right;
      padding: 0;
      margin: 0 0 2em 0;
    }
  </style>
`;
class ReviewWordCount extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    this.totalWords = this.countWords();
    return html`
        ${styles}
          <p class="xx-small-subtext-label">${this.totalWords} ${this.totalWords == 1? "word" : "words"}</p>

    `;
  }

  countWords(){
    if (!this.sentence)
        return 0;
    else{
      let splitSentence = this.sentence.split(' ');
      const allowedRegex = /[a-zA-Z]/;
      return splitSentence.filter((word) => allowedRegex.test(word)).length;
    } 
  }

  async firstUpdated() {
    this.totalWords = this.countWords();
  }

  static get properties() {
    return {
        sentence : String,
        totalWords : Number,
    };
  }
}

window.customElements.define('e-review-word-count', ReviewWordCount);
