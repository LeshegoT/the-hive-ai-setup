import { html } from '@open-wc/testing';
import sinon from 'sinon';
import icon_service from '../../../../src/services/icon.service';

const icon_svg = html`<svg><g id="wat"><text>WAT?!</text></g></svg>`;

export const load_stub = sinon.stub(icon_service, 'load').returns(Promise.resolve(icon_svg));