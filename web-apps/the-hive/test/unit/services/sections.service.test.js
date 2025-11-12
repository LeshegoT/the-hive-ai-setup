import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { SectionService } from '../../../src/services/sections.service';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';
import { SECTION_COMPLETED } from '../../../src/actions/section-completed.action';
import { SECTIONS_RECEIVED } from '../../../src/actions/sections-received.action';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';

describe('Service - SectionService', () => {
  let sectionService;
  let dispatch_spy;

  before(() => {
    sectionService = new SectionService();
    sectionService._store=new StoreStub();
    dispatch_spy = sinon.spy(sectionService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(sectionService.config).to.be.ok;
    expect(sectionService.store).to.be.ok;
  });

  describe('getSections', () => {
    let sections = [];

    before(() => fetch_stub_returns_json(sections));

    after(() => fetch_stub.reset());

    it('should get sections', async () => {
      let expected_action = {
        type: SECTIONS_RECEIVED,
        sections
      };

      await sectionService.getSections();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('getSectionMarkdown', () => {
    let markdown = new Blob();
    let readData = {
      readAsText() {
        this.onload();
      },
      onload() {}
    };
    let fileReader_stub;

    before(() => {
      fetch_stub_returns_json(markdown);
      fileReader_stub = sinon.stub(window, 'FileReader').returns(readData);
    });

    after(() => fetch_stub.reset());

    it('should get markdown', async () => {
      await sectionService.getSectionMarkdown('');

      expect(fileReader_stub.called).to.be.ok;
    });
  });

  describe('completeSection', () => {
    auth_service_stubs.uses_select_hero('test@bbd.co.za');

    before(() => fetch_stub_returns_json({}));

    after(() => fetch_stub.reset());

    it('should complete section', async () => {
      let expected_action = {
        type: SECTION_COMPLETED,
        sectionId: 1
      };
      await sectionService.completeSection(1);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('addTimeToSection', () => {
    before(() => fetch_stub_returns_json({}));

    after(() => fetch_stub.reset());

    it('should complete section', async () => {
      await sectionService.addTimeToSection(1, new Date());

      expect(fetch_stub.called).to.be.ok;
    });
  });
});
