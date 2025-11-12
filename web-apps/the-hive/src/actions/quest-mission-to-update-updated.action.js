export const QUEST_MISSION_TO_UPDATE_UPDATED = 'QUEST_MISSION_TO_UPDATE_UPDATED';

export const questMissionToUpdateUpdated = (mission) => {
    return {
        type: QUEST_MISSION_TO_UPDATE_UPDATED,
        mission
    };
}