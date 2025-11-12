import { html, LitElement } from 'lit';
import { hex, link } from '../styles';

let styles = html`
  <style>
    ${hex()} ${link()} :host {
      display: block;
    }

    .youTube{
      display: flex;
      align-items: center;
    }

    [style*="--aspect-ratio"] > :first-child {
      width: 100%;
    }
    [style*="--aspect-ratio"] > img {  
      height: auto;
    } 
    @supports (--custom:property) {
      [style*="--aspect-ratio"] {
        position: relative;
      }
      [style*="--aspect-ratio"]::before {
        content: "";
        display: block;
        padding-bottom: calc(100% / (var(--aspect-ratio)));
      }  
      [style*="--aspect-ratio"] > :first-child {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
      }  
    }
  </style>
`;

class YoutubeContent extends LitElement {
  render() {
    return html`
      ${styles}

      <section class='youTube' style="--aspect-ratio: 16/9;">
        <iframe
          width=1600;
          height="900" 
          src="https://www.youtube.com/embed/${this.youtubeKey}" 
          frameborder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </section>
    `;
  }

  static get properties() {
    return {
      youtubeKey: String,
      name: String
    };
  }
}

window.customElements.define('e-youtube-content', YoutubeContent);
