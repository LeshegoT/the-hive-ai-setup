export const SECTION_COMPLETED = 'SECTION_COMPLETED';

export const sectionCompleted = (sectionId) => {
    return {
        type: SECTION_COMPLETED,
        sectionId
    };
}