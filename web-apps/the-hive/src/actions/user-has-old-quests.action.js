export const USER_HAS_OLD_QUESTS = 'USER_HAS_OLD_QUESTS';

export const userHasOldQuests = (quests) => {
    return {
        type: USER_HAS_OLD_QUESTS,
        quests
    };
}