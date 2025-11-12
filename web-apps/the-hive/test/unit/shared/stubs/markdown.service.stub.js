import sinon from 'sinon';
import markdown_service from '../../../../src/services/markdown.service';

export const convertMarkdownToHtml_stub = sinon
  .stub(markdown_service, 'convertMarkdownToHtml');
