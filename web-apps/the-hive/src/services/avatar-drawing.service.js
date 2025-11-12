import { svg } from 'lit';
import {
  apprentice_styles,
  apprentice_colours,
  apprentice_gradients,
  hero_styles,
  hero_colours,
  hero_gradients,
  apprentice_viewbox,
  hero_viewbox
} from '../styles/characters';

export class AvatarDrawingService {
  constructor(parser, defs) {
    this.parser = parser;
    this.defs = defs;
  }

  async parse(text) {
    return await this.parser.parseFromString(text, 'image/svg+xml').documentElement;
  }

  async g(el) {
    return await el.querySelector('g');
  }

  async getPart(path) {
    let response = await fetch(path);
    let text = await response.text();
    let element = await this.parse(text);

    return await this.g(element);
  }

  async getBody(level) {
    return await this.getPart(`images/characters/${level}/body.svg`);
  }

  async getAvatar(body, allParts) {
    let level = body.level.code;
    let { red, green, blue } = body;

    let getParts = ['pattern', 'left', 'right', 'accessory'].map((type) => {
      let part = allParts[type];

      if (!part) return;

      return this.getPart(part.svgPath);
    });

    let promises = [this.getBody(level), ...getParts];

    let avatarDefs = this.defs[level];

    let selectedParts = await Promise.all(promises);

    return svg`
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${
        avatarDefs.viewBox
      }">
        <defs>
          ${avatarDefs.colours(red, green, blue)}
          ${avatarDefs.styles}
          ${avatarDefs.gradients}
        </defs>

        ${selectedParts.map((part) => part)}
      </svg>
    `;
  }

  async getPreviewPart(body, part) {
    let level = body.level.code;
    let { red, green, blue } = body;

    let avatarDefs = previewDefs[level];

    return this.getPart(part.svgPath).then((part) => {
      return svg`
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${
          avatarDefs.viewBox
        }">
          <defs>
            ${avatarDefs.colours(red, green, blue)}
            ${avatarDefs.styles}
            ${avatarDefs.gradients}
          </defs>

          ${part}
        </svg>
        `;
    });
  }
}

const defs = {
  apprentice: {
    viewBox: apprentice_viewbox,
    colours: (r, g, b) => apprentice_colours(r, g, b),
    styles: apprentice_styles,
    gradients: apprentice_gradients
  },
  hero: {
    viewBox: hero_viewbox,
    colours: (r, g, b) => hero_colours(r, g, b),
    styles: hero_styles,
    gradients: hero_gradients
  },
  master: {}
};

const previewDefs = {
  apprentice: {
    ...defs.apprentice,
    viewBox: '0 0 300 300'
  },
  hero: {
    ...defs.hero,
    viewBox: '0 0 375 375'
  },
  master: {
    ...defs.master
  }
};

export default new AvatarDrawingService(new DOMParser(), defs);
