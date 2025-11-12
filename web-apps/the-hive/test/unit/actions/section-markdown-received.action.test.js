import {
  SECTION_MARKDOWN_RECEIVED,
  sectionMarkdownReceived
} from '../../../src/actions/section-markdown-received.action.js';

import { expect } from '@open-wc/testing';

describe('Action - SECTION_MARKDOWN_RECEIVED', () => {
  it('returns an new action', async () => {
    let markdown = '*wat*';

    const action = sectionMarkdownReceived(markdown);

    expect(action.type).to.equal(SECTION_MARKDOWN_RECEIVED);
    expect(action).to.deep.equal({
      type: SECTION_MARKDOWN_RECEIVED,
      markdown
    });
  });
});
