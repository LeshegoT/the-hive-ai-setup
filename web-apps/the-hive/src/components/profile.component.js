import {LitElement, html} from 'lit';
import userService from '../services/user.service';
import { profile_placeholder } from './svg';

const styles = html`
  <style>
    .profile {
      height: 2.5em;
      width: 2.5em;
      border: 1px solid var(--app-tertiary-color);
      border-radius: 2.5em;
      background-size: cover;
      background-position: 60%;
    }

    svg {
      fill: var(--app-tertiary-color);
      height: 2.5em;
      width: 2.5em;
    }

  </style>
`;

class Profile extends LitElement {
  render() {
    return html`
      ${styles}
      ${this.renderProfile()}
    `;
  }

  renderProfile(){
    if(this.image){
      let background_image = `background-image: url(${this.image})`;
      return html`
      <div class="profile" .style="${background_image}"></div>
      `
    } else {
      return profile_placeholder;
    }
  }

  static get properties() {
    return {
      person: String,
      image: Object,
      noLoad: Boolean
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('person')) {
      this.loadImage();
    }
  }

  loadImage() {
    if(this.person){
      if (this.noLoad){
        this.image = undefined;
      }else{
        userService.getImage(this.person).then((image) => (this.image = image));
      }
    }else{
      this.image= undefined ;
    }
    
  }
}

window.customElements.define('e-profile', Profile);
