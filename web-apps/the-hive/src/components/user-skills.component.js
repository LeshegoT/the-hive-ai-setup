import { FieldTypeConverter } from '@the-hive/lib-skills-shared';
import { LitElement, html } from 'lit';
import configService from '../services/config.service';
import { FieldTypeService } from '../services/field-types.service';
import skillsService from '../services/skills.service';
import { shared } from '../styles';
import './app-card.component';
import './button.component';
import './collapsible.component';
import './confirmation-dialog.component';
import './loader.component';
import './notification.component';
const attributeTypesDescriptions = {
  'Skills': {
    description: "Abilities can be anything like an ability to use React, do platform engineering, use Figma, or SCRUM.",
    heading: "You have no abilities added!"
  },
  'Qualifications': {
    description: "Qualifications can be anything like a degree you got at a university or other institutions.",
    heading: "You have no qualifications added!"
  },
  'Certifications': {
    description: "Certifications can be anything like an AWS certification or a UX course you completed.",
    heading: "You have no certifications added!"
  },
  'Qualities': {
    description: "Soft skills can include qualities like 'communication,' 'teamwork,' or 'adaptability' that you've developed through various projects and experiences.",
    heading: "You have no qualities added!"
  },
  "Industry knowledge": {
    description: "Internal knowledge or experience can be anything like 'banking' or 'telecoms' experience that you gained in a project that you were part of.",
    heading: "You have no internal knowledge or experience added!!"
  }
}
export const skillsGlobalEventDispatcher = new EventTarget()

const styles = html`
  <style>
    ${shared()} p {
      color: var(--neutral-grey-color);
      text-align: center;
    }
    .empty-attribute-heading {
      font-size: var(--font-size-small);
      font-weight: var(--medium-font-weight);
      margin:0;
    }
    p {
      margin : var(--small-margin);
    }
    .empty-attribute-sub-heading {
      font-size: var(--font-size-tiny);
      font-weight: var(--light-font-weight);
    }
    a.material-icons-outlined {
      cursor: pointer;
    }
    .overlay-loader {
      display: none;
      inset: 0;
      justify-content: center;
      align-items: center;
      margin: var(--standard-margin);
      position: fixed;
      z-index: var(--z-index-overlay);
    }
    .overlay-loader.active {
      display: flex;
      background-color: var(--shadow-color);
      margin: 0;
    }
  </style>
`;

class UserSkills extends (LitElement) {
  constructor() {
    super();
    this.fieldTypeService = new FieldTypeService();
    this.fieldTypeConverter = new FieldTypeConverter(
      skillsService.mapStandardizedNameToCanonicalName,
      skillsService.mapStaffIdToDisplayName
    );
    this.userQualifications = undefined;
    this.userCertifications = undefined;
    this.userSkills = undefined;
    this.userIndustryExperience = undefined;
    this.userQualities = undefined;
    this.skills = undefined;
    this.expiryWarningThreshold = configService.skillCertificationExpiryThreshold;
    this.topLevelTags = undefined;
  }
  static get properties() {
    return {
      userQualifications: { type: Array },
      userCertifications: { type: Array },
      userQualities: { type: Array },
      skills: { type: Array },
      userSkills: { type: Array },
      userIndustryExperience: { type: Array },
      attributeToDelete: { type: Object },
      message: { type: String },
      type: { type: String },
      expiryWarningThreshold: { type: Number },
    };
  }

  firstUpdated(){
    this.getUserSkills();
    this.getTopLevelTags();
  }

  getTopLevelTags = async () => {
    this.topLevelTags = await skillsService.getTopLevelTags();
  }

  connectedCallback() {
    super.connectedCallback();
    skillsGlobalEventDispatcher.addEventListener('skills-updated', this.getUserSkills);
  }

  disconnectedCallback() {
    skillsGlobalEventDispatcher.removeEventListener('skills-updated', this.getUserSkills);

    super.disconnectedCallback();
  }

  toggleConfirmation(attribute) {
    this.attributeToDelete = attribute;
    const confirmationDialog = this.shadowRoot.querySelector('confirmation-dialog');
    confirmationDialog.show();
  }

  async downloadAttachment(filePath) {
    const blob = await skillsService.getAttachment(filePath)
    const filename = 'attachment.pdf';
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a)
}

  async confirmDelete(event) {
    this.message = '';
    if (event.detail && this.attributeToDelete) {
      this.shadowRoot.querySelector('e-loader').classList.add('active');
      const response = await skillsService.deleteAttribute(this.attributeToDelete.attribute, this.attributeToDelete.guid);
      this.shadowRoot.querySelector('e-loader').classList.remove('active');
      if (!response.success) {
        this.message = response.error;
        this.type = 'error'
      } else {
        skillsGlobalEventDispatcher.dispatchEvent(new CustomEvent('skills-updated'));
        this.message = response.success;
        this.type = 'success'
      }
    } else {
      // nothing, delete was not confirmed
    }
    this.attributeToDelete = undefined;
  }

  getUserSkills = async () => {
    this.skills = await skillsService.getUserAttributes()
    skillsGlobalEventDispatcher.dispatchEvent(new CustomEvent('user-attributes-fetched',{detail: this.skills}))
    if(this.skills !=undefined){
        this.userQualifications = await Promise.all(
          this.skills
            .filter((attribute) => attribute.attribute.attributeType === 'qualification')
            .map(async (experience) => {
              experience.fieldValues = await this.orderDetails(experience.fieldValues);
              return experience;
            })
        );

        this.userCertifications = await Promise.all(
          this.skills
            .filter((attribute) => attribute.attribute.attributeType === 'certification')
            .map(async (experience) => {
              experience.fieldValues = await this.orderDetails(experience.fieldValues);
              return experience;
            })
        );

        this.userSkills = await Promise.all(
          this.skills
            .filter((attribute) => attribute.attribute.attributeType === 'skill')
            .map(async (experience) => {
              experience.fieldValues = await this.orderDetails(experience.fieldValues);
              return experience;
            })
        );

        this.userIndustryExperience = await Promise.all(
          this.skills
            .filter((attribute) => attribute.attribute.attributeType === 'industry-knowledge')
            .map(async (experience) => {
              experience.fieldValues = await this.orderDetails(experience.fieldValues);
              return experience;
            })
        );
        this.userQualities = await Promise.all(
          this.skills
            .filter((attribute) => attribute.attribute.attributeType === "quality")
            .map(async (experience) => {
              experience.fieldValues = await this.orderDetails(experience.fieldValues);
              return experience;
            })
        );
    } else{
      //still loading
    }
  }

  async orderDetails(fieldValues) {
    const jsType = (await this.fieldTypeService.getJSTypes()).types;
    const jsTypeScale = (await this.fieldTypeService.getJSTypeScale()).fields;
    const skillsFields = (await this.fieldTypeService.getSkillsFields()).fields;

    const fieldsDetails = this.fieldTypeConverter.createFieldsMap(fieldValues.map(fieldvalue => fieldvalue = fieldvalue.standardizedName), skillsFields, jsType, jsTypeScale);
    const orderedDetails = fieldValues.sort((a, b) => {
      return fieldsDetails[a.standardizedName].displayOrder - fieldsDetails[b.standardizedName].displayOrder;

    });
    return await this.makeDetailsReadable(orderedDetails, fieldsDetails)
  }

  async makeDetailsReadable(attributeDetails, fieldsDetails) {
    const readableDetails = {};

    const fieldsToDisplay = attributeDetails.map(attributeDetail => attributeDetail.standardizedName).filter(field => fieldsDetails[field].displayOnPortfolioScreen);

    for (const field of fieldsToDisplay) {
      const fieldValue = attributeDetails.find(attributeDetail => attributeDetail.standardizedName === field).value;
      const parsedValue = await fieldsDetails[field].parse(fieldValue);
      const displayValue = fieldValue === 'current' ? 'current' : await fieldsDetails[field].toDisplay(parsedValue || fieldValue);
      readableDetails[field] = displayValue;
    }

    return readableDetails;
  }

  renderFeedbackNotifications() {
    const showingLoader = this.shadowRoot.querySelector('e-loader')?.classList.contains('active');
    return this.message && this.type && !showingLoader ? html`
      <e-notification type="${this.type}">
        ${this.message}
      </e-notification>
    ` : html``;
  }

  checkExpiryDate(certification){
    if(certification.fieldValues.expiryDate){
      const currentDate = new Date();
      const expiry = new Date(certification.fieldValues.expiryDate);

      const timeDiff = expiry - currentDate;

      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      if(daysDiff < 0){
        return  html`<e-pill size="small" color="primary">Expired</e-pill>`;
      }else if(daysDiff <= this.expiryWarningThreshold){
        return html`<e-pill size="small" color="warning">Expiring soon</e-pill>`;
      }else{
        //certification is not expiring soon
      }
    }else{
      //the certification doesn't expire
    }

  }

  editAttribute(attribute) {
    const event = new CustomEvent('edit-attribute', {
      detail: attribute,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  renderCollapsibleComponentForAttribute(attributes,attributeType){
    if(attributes){
      return html`
      <e-collapsible
         collapsibleActive="true"
         collapsibleHeading="${attributeType}"
         collapsibleContentsInfo=${attributeTypesDescriptions[attributeType].description}
       >
          ${attributes.length > 0
          ? this.renderUserAttributes(attributes)
          : this.renderIfNoAttributeTypeAdded(attributeType)}
       </e-collapsible>
     `
    }
    else{
      return html``
    }
  }

  renderIfNoAttributeTypeAdded(attributeType) {
    return html`
      <p class="empty-attribute-heading">${attributeTypesDescriptions[attributeType].heading}</p>
      <p class="empty-attribute-sub-heading">${attributeTypesDescriptions[attributeType].description}</p>
      <p class="empty-attribute-sub-heading">Use the searchbox above to find ${attributeType.toLowerCase()} to add.</p>
    `;
  }

  renderStatusOrAttachmentForProof(attribute){
    const proof = attribute.fieldValues.proof;
    const proofUploaded = proof !== configService.skillsFileDefault
    if(proof){
      return proofUploaded ?
      html`
        <a class="material-icons-outlined icon" title="download file" @click=${() => this.downloadAttachment(attribute.fieldValues.proof)}>attachment</a>
        ` : html`
          <e-pill size="small" color="primary">Pending proof</e-pill>
        `
    }
    else{
      return html``
    }
  }


  renderUserAttributes(attributes) {
    return html`
      <div class="cards-container">
        ${attributes.map(
          (attribute) => html`
            <e-card-component cardTitle="${attribute.attribute.canonicalName}" .contents="${attribute.fieldValues}">
              <div slot="footer-left">
                ${this.renderStatusOrAttachmentForProof(attribute)}
                ${this.checkExpiryDate(attribute)}
              </div>
              <div slot="footer-right">
                <a class="material-icons-outlined"  @click="${() => this.editAttribute(attribute)}">edit</a>
                <a class="material-icons-outlined" @click="${() => this.toggleConfirmation(attribute)}">delete</a>
              </div>
            </e-card-component>
          `
        )}
      </div>
    `;
  }

  render() {
    const topLevelTags = this.topLevelTags
    if(this.userQualifications != undefined && this.userSkills != undefined & this.userQualities != undefined && this.userIndustryExperience != undefined && this.userCertifications != undefined){
    return html`
      ${styles}
      ${this.renderFeedbackNotifications()}
      <confirmation-dialog @confirm=${this.confirmDelete}>
        ${`Are you sure you want to delete this ${this.attributeToDelete ? (topLevelTags.find(topLeveltag => topLeveltag.standardizedName == this.attributeToDelete.attribute.attributeType)).canonicalName.toLowerCase()  : ''}`}
      </confirmation-dialog>
      <e-loader class="overlay-loader" message="Deleting..."></e-loader>
      ${this.renderCollapsibleComponentForAttribute(this.userQualifications,'Qualifications')}
      ${this.renderCollapsibleComponentForAttribute(this.userCertifications,'Certifications')}
      ${this.renderCollapsibleComponentForAttribute(this.userSkills,'Skills')}
      ${this.renderCollapsibleComponentForAttribute(this.userIndustryExperience,'Industry knowledge')}
      ${this.renderCollapsibleComponentForAttribute(this.userQualities,'Qualities')}
    `;
    } else {
      return html`
        <e-loader></e-loader>
      `;
    }
  }
}

customElements.define('e-user-skills', UserSkills);
