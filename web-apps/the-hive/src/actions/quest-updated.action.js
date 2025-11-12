export const QUEST_UPDATED = 'QUEST_UPDATED';

export const questUpdated = (response) => {
    return {
        type: QUEST_UPDATED,
        ...response
    };
}