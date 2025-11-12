export const HERO_QUEST_RECEIVED = 'HERO_QUEST_RECEIVED';

export const heroQuestReceived = (quest) => {
    return {
        type: HERO_QUEST_RECEIVED,
        quest
    };
}