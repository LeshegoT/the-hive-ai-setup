export const SIDE_QUESTS_RECEIVED = 'SIDE_QUESTS_RECEIVED';

export const sideQuestsReceived = (sideQuests) => {
    sideQuests = sideQuests.map(sideQuest => {
      let startDate = new Date(sideQuest.startDate);
      return {
        ...sideQuest,
        startDate 
      };
    })
    return {
        type: SIDE_QUESTS_RECEIVED,
        sideQuests
    };
}