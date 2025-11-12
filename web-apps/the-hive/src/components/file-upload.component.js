import {LitElement, html} from 'lit';
import { shared } from '../styles';
import './button.component';
import './checkbox.component';
import './pill.component';
export const fileTypes = {
  pdf: 'pdf',
  png: 'png',
  jpeg: 'jpeg',
};

const styles = html`
  <style>
    ${shared()} :host {
      --file-name-max-width: 9em;
    }
    .file-upload {
      display: flex;
      flex-direction: column;
      max-height: var(--max-box-width);
      text-align: center;
      border-radius: var(--app-small-border-radius);
      padding: var(--standard-padding);
    }
    .dashed-border{
      border: var(--small-border-size) dashed var(--app-tertiary-color);
    }
    .material-icons-outlined{
      cursor:pointer;
    }
    .material-icons-outlined.attachment{
      color:var(--primary-red-color);
    }
    .uploaded-file-name{
      padding-inline:var(--standard-padding)
    }
    .uploaded-file-name > p{
      font-weight:var(--regular-font-weight);
      font-size:var(--font-size-tiny);
    }
    .inline-flex-items{
      gap:var(--medium-gap);
    }
    input[type='file'] {
      font-size: 0;
      margin:auto;
    }
    h3,
    p,
    h4 {
      margin: 0;
    }

    ::file-selector-button {
      font-size: initial;
      font-weight: var(--semi-bold-font-weight);
      border: none;
      background: var(--app-primary-color);
      padding: var(--standard-padding) var(--large-padding);
      border-radius: var(--medium-radius);
      color: var(--app-light-text-color);
      cursor: pointer;
    }
    .error {
      border-color: var(--app-primary-color);
    }
    h4 {
      font-size: var(--font-size-small);
      font-weight: var(--regular-font-weight);
    }
    h3 {
      font-weight: var(--regular-font-weight);
      font-size: var(--font-size-medium-small);
    }
    .file-name {
      max-width: var(--file-name-max-width);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    e-pill > * {
      margin-inline: var(--small-margin);
    }
    e-button {
      margin-left: auto;
    }
    label {
      font-size: var(--font-size-medium-small);
      font-weight: var(--regular-font-weight);
    }
  </style>
`;

class FileUpload extends LitElement {
  constructor() {
    super();
    this.file = '';
    this.canUploadLater = true;
    this.canUploadLaterChecked = false;
  }

  static get properties() {
    return {
      file: { type: Object },
      error: { type: String },
      name: { type: String },
      label: { type: String },
      canUploadLater: { type: Boolean },
      previouslyUploadedFile: { type: String | Object },
      acceptedFiles: { type: Array },
      fileSize: { type: Number },
      canUploadLaterChecked: { type: Boolean },
      submitFile: { type: Function },
    };
  }

  viewUploadedFile() {
    const fileUrl = URL.createObjectURL(this.file);
    window.open(fileUrl, '_blank');
  }

  handleErrors() {
    const acceptedFiles = this.acceptedFiles;
    if ((!this.previouslyUploadedFile && !this.file && !this.canUploadLaterChecked) ||(this.file && !acceptedFiles.some((acceptedType) => this.file.type.includes(acceptedType)))) {
      let errorMessage = 'Please upload a ';
      if (acceptedFiles.length === 1) {
        errorMessage += `${this.acceptedFiles} file`;
      } else {
        const lastFile = this.acceptedFiles.splice(-1);
        errorMessage += `${this.acceptedFiles} or ${lastFile} file`;
      }
      this.file = '';
      this.error = errorMessage;
    } else if (this.fileSize && this.file.size / (1024 * 1024) > this.fileSize) {
      this.file = '';
      this.error =  `File size too large.Maximum size allowed: ${this.fileSize}MB`;
    } else {
      this.error = undefined;
      this.dispatchEvent(new CustomEvent('uploaded', { detail: this.file }));
    }
  }

  handleFileChange(e) {
    this.canUploadLaterChecked = false;
    this.file = e.target.files[0];
    this.handleErrors();
  }

  handleDrop(e) {
    e.preventDefault();
    this.file = e.dataTransfer.files[0];
    this.handleErrors();
  }

  handleDragOver(e) {
    e.preventDefault();
  }

  renderError() {
    if (this.error) {
      return html`
        <p class="error-message">${this.error}</p>
      `;
    } else {
      return html``;
    }
  }
  renderSubmitButton() {
    if (this.submitFile) {
      return html`
        <e-button size="medium" color="primary">Submit</e-button>
      `;
    } else {
      return html``;
    }
  }
  removeFile() {
    this.file = '';
    this.error = undefined;
    this.dispatchEvent(new CustomEvent('uploaded', { detail: undefined }));
  }

  handleUploadLaterChecked(e) {
    this.canUploadLaterChecked = e.detail;
    if (e.detail && (this.file || this.error)) {
      this.removeFile();
    } else {
      //do nothing,there's no error or file to remove
    }
    this.dispatchEvent(new CustomEvent('checked', { detail: e.detail}));
  }

  downloadPreviouslyUploadedFile(){
    this.dispatchEvent(new CustomEvent('download-file'));
  }

  deletePreviouslyUploadedFile(){
    this.dispatchEvent(new CustomEvent('delete-file',));
  }

  renderPreviouslyUploadedFile(){
    return html`
      <h3>${this.label}</h3>
      <div class="inline-flex-items">
        <div class='inline-flex-items dashed-border uploaded-file-name'>
        <a class="material-icons-outlined attachment">attach_file</a>
        <p>Attachment</p>
        </div>
              <a
                title="download file"
                class="material-icons-outlined icon"
                @click=${() => this.downloadPreviouslyUploadedFile()}
              >
                file_download
              </a>
              <a title="delete file" class="material-icons-outlined" @click=${() => this.deletePreviouslyUploadedFile()}>delete</a>
              </div>
    `
  }

  renderUploadLater() {
    return this.canUploadLater
      ? html`
          <p>or</p>
          <e-checkbox
            name="uploadLater"
            label="Upload file later"
            ?checked="${this.canUploadLaterChecked}"
            @change="${this.handleUploadLaterChecked}"
          >
          </e-checkbox>
        `
      : html``;
  }

  renderUploadFileField() {
    return html`
    <label for=${this.name}>${this.label}</label>
      <div
        class="file-upload dashed-border ${this.error ? "error" : ""}"
        @dragover="${this.handleDragOver}"
        @drop="${this.handleDrop}"
      >
        <h3>Drag files to upload</h3>
        <p>or</p>
        <input id=${this.name} type="file"  @change="${this.handleFileChange}" name="${this.name}" .value="${this.file}" />
        ${this.renderUploadLater()}
      </div>
      ${this.renderError()}

      `;
  }

  renderFileUploadedField() {
    return html`
      <div class="file-upload dashed-border">
        <h3>File successfully uploaded!</h3>
        <e-pill size="large" color="primary">
          <span @click="${this.viewUploadedFile}" class="material-symbols-outlined" title="view file">attachment</span>
          <span class="file-name">${this.file.name}</span>
          <span @click="${this.removeFile}" class="material-symbols-outlined" title="remove file">close</span>
        </e-pill>
        ${this.renderSubmitButton()}
      </div>
    `;
  }

  render() {
    return html`
      ${styles} ${this.file ? this.renderFileUploadedField() :this.previouslyUploadedFile ?this.renderPreviouslyUploadedFile(): this.renderUploadFileField()}
    `;
  }
}
window.customElements.define('e-file-upload', FileUpload);
