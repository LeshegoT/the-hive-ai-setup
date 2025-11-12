export const QUEST_EXISTS_ERROR_RECEIVED = 'QUEST_EXISTS_ERROR_RECEIVED';

export const questExistsErrorReceived = (quest) => {
    return {
        type: QUEST_EXISTS_ERROR_RECEIVED,
        quest
    };
}