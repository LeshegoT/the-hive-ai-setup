export const HERO_QUESTS_RECEIVED = 'HERO_QUESTS_RECEIVED';

export const heroQuestsReceived = (quests) => {
    return {
        type: HERO_QUESTS_RECEIVED,
        quests
    };
}