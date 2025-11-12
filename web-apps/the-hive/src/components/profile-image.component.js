import {LitElement, html} from 'lit';
import userService from "../services/user.service";
import { profile_placeholder } from "./svg";

const style = html`
  <style>
    .profile {
      cursor: pointer;
      height: 8em;
      aspect-ratio: 1 / 1;
      border-radius: 100%;
      background-size: cover;
      margin-left: 1.5em;
      margin-bottom: 1.5em;
      margin-top: 1em;
      transition: transform 0.3s ease-in-out;
    }

    .profile:hover {
      transform: scale(1.3);
    }
  </style>
`;

export class ProfileImage extends LitElement {
    static properties = {
        upn: {type: String},
        image: {type: Object}
    }

    constructor(){
        super();
    }

    render(){
        this.loadImage();
        if (this.image) {
            let background_image = `background-image: url(${this.image})`;
            return html`
                ${style}
                <div class="profile" style="${background_image}"></div>
            `;
        } else {
            return html`
                ${style}
                <div class="profile">${profile_placeholder}</div>
            `;
        }
    }

    loadImage(){
        userService.getImage(this.upn).then((image) => (this.image = image));
    }
}

window.customElements.define('e-profile-image', ProfileImage);
