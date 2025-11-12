import { expect, html } from '@open-wc/testing';
import sinon from 'sinon';
import avatar_drawing_service, {
  AvatarDrawingService
} from '../../../src/services/avatar-drawing.service';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';

const defs = {
  apprentice: {
    viewBox: '',
    colours: (r, g, b) => html``,
    styles: html``,
    gradients: html``
  }
};

class ElementStub {
  querySelector(element) {
    return '<g id="wat"><text>WAT?!</text></g>';
  }
}

class ParserStub {
  parseFromString() {
    return {
      documentElement: Promise.resolve(new ElementStub())
    };
  }
}

let g_element = '<g id="wat"><text>WAT?!</text></g>';

describe('Service - Avatar Drawing', () => {
  let avatarDrawingService;
  let parser_stub;

  before(() => {
    parser_stub = new ParserStub();
    avatarDrawingService = new AvatarDrawingService(parser_stub, defs);
  });

  it('should initialise correctly.', () => {
    expect(avatarDrawingService.parser).to.be.ok;
    expect(avatarDrawingService.defs).to.be.ok;
  });

  describe('getPart and getBody', () => {
    before(() => fetch_stub_returns_json(`<svg>${g_element}</svg>`));

    after(() => fetch_stub.reset());

    it('should return <g> element from svg on get part', async () => {
      let actual = await avatarDrawingService.getPart('path');

      expect(actual).to.be.ok;
      expect(actual).to.equal(g_element);
    });

    it('should return <g> element from svg on get part', async () => {
      let actual = await avatarDrawingService.getBody('apprentice');

      expect(actual).to.be.ok;
      expect(actual).to.equal(g_element);
    });
  });

  describe('getAvatar', () => {
    let getBody_stub, getPart_stub;

    before(() => {
      getBody_stub = sinon.stub(avatar_drawing_service, 'getBody').returns(g_element);
      getPart_stub = sinon.stub(avatar_drawing_service, 'getPart').returns(g_element);
    });

    after(() => {
      getBody_stub.reset();
      getPart_stub.reset();
    });

    it('should return svg with body and parts', async () => {
      let body = { level: { code: 'apprentice' }, red: 0, green: 0, blue: 0 };
      let parts = { left: { svgPath: 'path' } };

      let actual = await avatar_drawing_service.getAvatar(body, parts);

      expect(actual).to.be.ok;
      expect(getBody_stub.calledWith('apprentice')).to.be.ok;
      expect(getPart_stub.calledWith('path')).to.be.ok;
    });
  });
});
