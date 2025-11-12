export const SIDE_QUEST_REGISTERED = 'SIDE_QUEST_REGISTERED';

export const sideQuestRegistered = (sideQuest) => {
    return {
        type: SIDE_QUEST_REGISTERED,
        sideQuest
    };
};
