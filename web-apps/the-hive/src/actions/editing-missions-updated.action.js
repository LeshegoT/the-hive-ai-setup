export const EDITING_MISSSIONS_UPDATED = 'EDITING_MISSSIONS_UPDATED';

export const editingMissionsUpdated = (missions) => {
    return {
        type: EDITING_MISSSIONS_UPDATED,
        missions
    };
}