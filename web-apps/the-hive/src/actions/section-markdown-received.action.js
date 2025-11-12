export const SECTION_MARKDOWN_RECEIVED = 'SECTION_MARKDOWN_RECEIVED';

export const sectionMarkdownReceived = (markdown) => {
    return {
        type: SECTION_MARKDOWN_RECEIVED,
        markdown
    };
}