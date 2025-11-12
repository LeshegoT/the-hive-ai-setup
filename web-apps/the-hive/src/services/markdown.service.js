import Prism from 'prismjs';
import showdown from 'showdown';
import '../../../../node_modules/prismjs/components/prism-csharp';
import '../../../../node_modules/prismjs/components/prism-java';
import '../../../../node_modules/prismjs/components/prism-typescript';

class MarkdownService {
rewriteMarkdownImagePaths(fileLocation, htmlText) {
  const imagePath = fileLocation.substr(0, fileLocation.lastIndexOf('/'));
  const coursePrefix = `courses/${imagePath}`;

  // Matches <img> tags with src attributes pointing to images/ folder
  const imgTagSrcRegex = /(img.*?src=["'])(images\/.*?)(["'])/gi;
  htmlText = htmlText.replace(imgTagSrcRegex, `$1${coursePrefix}/$2$3`);

  // Matches <a> tags with href attributes pointing to images/ folder
  const anchorTagHrefRegex = /(<a.*?href=["'])(images\/.*?)(["'])/gi;
  htmlText = htmlText.replace(anchorTagHrefRegex, `$1${coursePrefix}/$2$3`);

  return htmlText;
}

  addTargetToLinks(htmlText) {
    // Match <a> tags where the href does NOT start with '#' (external or full links)
    // So we can add target="_blank" to open these links in a new tab
    let anchorTagWithExternalHrefRegex = /<a(\s+[^>]*href=["'](?!#)[^"']+["'][^>]*)>/gi;
    htmlText = htmlText.replace(
      anchorTagWithExternalHrefRegex,
      '<a$1 target="_blank">'
    );

    // Match <a> tags where the href starts with '#' (in-page anchors)
    // So we can explicitly add target="_self" to ensure they stay on the same page
    let anchorTagWithInPageHrefRegex = /<a(\s+[^>]*href=["']#[^"']*["'][^>]*)>/gi;
    htmlText = htmlText.replace(
      anchorTagWithInPageHrefRegex,
      '<a$1 target="_self">'
    );


    return htmlText;
}

  convertMarkdownToHtml(markdown, path) {
    let converter = new showdown.Converter({ tables: true });

    let htmlText = converter.makeHtml(markdown);

    if (path) htmlText = this.rewriteMarkdownImagePaths(path, htmlText);
    htmlText = this.addTargetToLinks(htmlText);

    const parser = new DOMParser();
    const element = parser.parseFromString(htmlText, 'text/html').documentElement;

    Prism.highlightAllUnder(element);

    return element;
  };
}

export default new MarkdownService;
