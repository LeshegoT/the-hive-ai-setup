export const MAP_MISSION_RECEIVED = 'MAP_MISSION_RECEIVED';

export const mapMissionReceived = (mapMission) => {
    return {
        type: MAP_MISSION_RECEIVED,
        mapMission
    };
}