import { directive } from 'lit/directive.js';
import { AsyncDirective } from 'lit/async-directive.js';

class ImportCssModuleDirective extends AsyncDirective {

  constructor(part) {
    super(part);
  }

  update(_, [promise]) {
      Promise.resolve(promise)
        .then((module) => module.default)
        .then((css) => {
          this.setValue(css);
    });

    return this.value;
  }

  render() {
    return '';
  }
}

export const importCssModule = directive(ImportCssModuleDirective);


export let variables = () => importCssModule(import('./variables.css'));
export let shared = () => importCssModule(import('./shared.css'));
export let reviewShared = () => importCssModule(import('./reviewShared.css'));
export let eventsShared = () => importCssModule(import('./eventsShared.css'));
export let animations = () => importCssModule(import('./animations.css'));
export let form = () => importCssModule(import('./form.css'));
export let inputFields= () => importCssModule(import('./input-fields.css'));
export let hex = () => importCssModule(import('./hex.css'));
export let link = () => importCssModule(import('./link.css'));
export let lists = () => importCssModule(import('./lists.css'));
export let activities = () => importCssModule(import('./activities.css'));
export let material_button = () => importCssModule(import('../../../../node_modules/@material/button/dist/mdc.button.min.css'));
export let material_card = () => importCssModule(import('../../../../node_modules/@material/card/dist/mdc.card.min.css'));
export let material_icon_button = () => importCssModule(import('../../../../node_modules/@material/icon-button/dist/mdc.icon-button.min.css'));