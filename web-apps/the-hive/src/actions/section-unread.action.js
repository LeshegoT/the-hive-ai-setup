export const SECTION_UNREAD = 'SECTION_UNREAD';

export const sectionUnread = (sectionId) => {
    return {
        type: SECTION_UNREAD,
        sectionId
    };
}