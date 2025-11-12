export const LEARNING_TASKS_RECEIVED = 'LEARNING_TASKS_RECEIVED';

export const learningTasksReceived = (learningTasks) => {
    return {
        type: LEARNING_TASKS_RECEIVED,
        learningTasks
    };
}