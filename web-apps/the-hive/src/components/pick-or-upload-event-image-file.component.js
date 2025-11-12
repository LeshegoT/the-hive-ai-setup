import {LitElement, html} from 'lit';
import eventsService from '../services/events.service.js';
import { reviewShared } from '../styles/index.js';
import configService from '../services/config.service.js';

const styles = html`
  <style>
    ${reviewShared()} :host {
      display: flex;
      flex-direction: column;
      gap: var(--small-gap);
      align-items: flex-start;
    }

    p {
      margin: 0;
    }

    #failed{
      color: var(--app-primary-color);
    }

    #success{
      color: var(--app-assign-feedback-button-hover-color)
    }

    p {
      margin: 0;
    }

    #failed{
      color: var(--app-primary-color);
    }

    #success{
      color: var(--app-assign-feedback-button-hover-color)
    }

    .images-container {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--small-gap);

      img {
        max-width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: var(--app-small-border-radius);
      }

      .not-selected:hover {
        cursor: pointer;
        border: var(--small-border-size) solid var(--app-info-font-color);
      }

      .selected {
        border: var(--medium-border-size) solid var(--app-primary-color);
        z-index: 1;
      }
    }

    button {
      padding: var(--small-padding);
    }

    #error-message {
      color: var(--app-primary-color);
    }

    .hidden {
      display: none;
    }
  </style>
`;

class PickOrUploadEventImage extends LitElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    super.connectedCallback();
    return this.reloadImages();
  }

  async reloadImages() {
    const items = await eventsService.getUploadedImages();
    for (const image of items) {
      image.url = this.imageDownloadUrl(image.name);
    }

    this.images = items;
  }

  render() {
    return html`
      ${styles}
      <button class="redButton" @click="${this.onSelectNewImageButtonClicked}">Upload Image</button>
      <input class="hidden" id="events-image-pick-button" type="file" @change=${this.onFileSelected} accept="image/*" />
      <span id="error-message" hidden>File size exceeds ${configService.maximumImageUploadFileSize}MB.</span>
      <section class="images-container">${this.renderImages()}</section>
    `;
  }

  imageDownloadUrl(imagePath) {
    return eventsService.getImageDownloadUrl(imagePath);
  }

  async onFileSelected(event) {
    const file = event.target.files[0];
    this.renderRoot.getElementById('error-message').hidden = true;
    const maxSize = configService.maximumImageUploadFileSize*1024*1024;
    if (file) {
      if (file.size < maxSize) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (_) => {
            resolve(this.uploadFile(file, file.name));
          };

          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
      } else {
        this.renderRoot.getElementById('error-message').hidden = false;
      }
    } else {
      // Do nothing because user did not choose file to upload.
    }
  }

  onSelectNewImageButtonClicked() {
    this.renderRoot.querySelector('#events-image-pick-button').click();
  }

  async uploadFile(blob, filename) {
    this.uploadResponse = await eventsService.uploadImage(blob, filename);
    return this.reloadImages();
  }

  onImagePicked(image) {
    this.dispatchEvent(new CustomEvent('image-picked', { detail: image }));
    this.selectedImage = image;
  }


  renderUploadMessage() {
    return html`
      <p id="${ this.uploadResponse.status ? 'success' : 'failed'}">${this.uploadResponse.message}</p>
    `
  }

  renderImages() {
    return this.images.map(
      (image) => html`
        <img
          src="${image.url}"
          alt="Uploaded image named ${image.nameInFolder}"
          @click="${() => this.onImagePicked(image)}"
          class="${this.selectedImage === image ? 'selected' : 'not-selected'}"
        />
      `
    );
  }

  static get properties() {
    return {
      images: Array,
      uploadResponse: Object,
      selectedImage: Object,
    };
  }
}

window.customElements.define('e-pick-or-upload-event-image', PickOrUploadEventImage);
