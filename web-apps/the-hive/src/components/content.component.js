import { html } from 'lit';
import { shared } from '../styles';
import sectionService from '../services/sections.service';
import { selectSectionMarkdown } from '../selectors/sections.selector';
import markdownService from '../services/markdown.service';

// This *could* be handled differently.
import theme from 'prismjs/themes/prism-tomorrow.css';
import { StatefulElement } from './stateful-element.js';

const styles = html`
  html {
    margin: 3em 0;
  }

  p {
    text-align: justify;
  }

  li {
    text-align: justify;
  }

  h1,
  h2,
  h3,
  h4,
  h5 {
    text-align: left;
  }

  h1 {
    font-size: 1.5em;
  }

  h2 {
    font-size: 1.25em;
  }

  img {
    max-width: 100%;
    width: inherit;
    display: block;
    margin: auto;
  }

  table {
    border-spacing: 0;
  }

  td,
  th {
    padding: 0.2em;
    margin: 0;
    border-bottom: 1px solid var(--app-dark-text-color);
  }

  tr:nth-child(even) {
    background-color: #eee;
  }

  @media (max-width: 460px) {
    html {
      margin: 3em -1.5em;
    }
  }
`;

class Content extends StatefulElement {

  render() {
    return html`
      <style>
        ${shared()}
        ${styles}
        ${theme}
      </style>

      <div>
        ${this.generated}
      </div>
    `;
  }

  static get properties() {
    return {
      pathToMarkdown: String,
      generated: Object
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('pathToMarkdown')) {
      sectionService.getSectionMarkdown(this.pathToMarkdown);
    }
  }

  stateChanged(state) {
    super.stateChanged(state);

    const markdown = selectSectionMarkdown(state);

    if (markdown) {
      this.generated = markdownService.convertMarkdownToHtml(markdown, this.pathToMarkdown);
    }
  }
}

window.customElements.define('e-content', Content);
