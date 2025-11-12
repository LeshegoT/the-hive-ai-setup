import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { ContentService } from '../../../src/services/content.service';
import { ContentTagsService } from '../../../src/services/content_tags.service';
import { CONTENT_ADDED, CONTENT_RECEIVED } from '../../../src/actions/content-received.action';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';

describe('Service - CointentService', () => {
  let contentService;
  let contentTagsService;
  let dispatch_spy;

  before(() => {
    contentService = new ContentService();
    contentService._store=new StoreStub();
    contentTagsService = new ContentTagsService();
    contentTagsService._store=new StoreStub();
    dispatch_spy = sinon.spy(contentService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(contentService.config).to.be.ok;
    expect(contentService.store).to.be.ok;
  });

  describe('get and create content', () => {
    let content = [];

    before(() => fetch_stub_returns_json(content));

    after(() => fetch_stub.reset());

    it('should return all content', async () => {
      let expected_action = {
        type: CONTENT_RECEIVED,
        content
      };

      await contentService.getContent();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
      expect(fetch_stub.calledWith('http:/localhost/content'));
    });
  });

  describe('get and create content', () => {
    let content = {};

    before(() => fetch_stub_returns_json(content));

    after(() => fetch_stub.reset());

    it('should return newly created content', async () => {
      let url = 'https://link.to.content';
      let mediaTypeId = 1;
      let ratingId = 1;
      let userPrincipalName = 'test@bbd.co.za';
      let tags = [];

      let expected_action = {
        type: CONTENT_ADDED,
        content
      };

      await contentService.addCuratedContent(url, mediaTypeId, ratingId, userPrincipalName, tags);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });
});