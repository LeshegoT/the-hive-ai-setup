import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { ContentTagsService } from '../../../src/services/content_tags.service';
import {TAGS_RECEIVED } from '../../../src/actions/tags-received.action';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';

describe('Service - CointentTagsService', () => {
  let contentTagsService;
  let dispatch_spy;

  before(() => {
    contentTagsService = new ContentTagsService();
    contentTagsService._store=new StoreStub();
    dispatch_spy = sinon.spy(contentTagsService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(contentTagsService.config).to.be.ok;
    expect(contentTagsService.store).to.be.ok;
  });

  describe('get content tags', () => {
    let tags = [];

    before(() => fetch_stub_returns_json(tags));

    after(() => fetch_stub.reset());

    it('should return all contentTag', async () => {
      let expected_action = {
        type: TAGS_RECEIVED,
        tags
      };

      await contentTagsService.getTags();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
      expect(fetch_stub.calledWith('http:/localhost/tags-and-synonyms'));
    });
  });
});
