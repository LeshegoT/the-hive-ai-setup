export const QUEST_EDITOR_ERRORS_FOUND = 'QUEST_EDITOR_ERRORS_FOUND';

export const questEditorErrorsFound = (errors) => {
    return {
        type: QUEST_EDITOR_ERRORS_FOUND,
        errors
    };
}