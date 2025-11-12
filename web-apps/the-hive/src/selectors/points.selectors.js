export const selectAllPoints = (state) => state.points.all.allPoints;

export const selectTodaysPoints = (state) => state.points.all.todaysPoints;

export const selectTotalPoints = (state) => state.points.all.totalPoints;

export const selectHighScore = (state) => state.points.all.highScore;

export const selectType = (state, typeCode) => {
    let type = state.points.types.find((t) => t.code === typeCode);
    return parseInt(type.points);
}

export const selectNotifier = (state) => state.points.notifier;