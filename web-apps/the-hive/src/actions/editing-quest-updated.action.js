export const EDITING_QUEST_UPDATED = 'EDITING_QUEST_UPDATED';

export const editingQuestUpdated = (quest) => {
  if (quest.startDate && quest.months) {

    const newDate = new Date(quest.startDate);
    newDate.setMonth(newDate.getMonth() + parseInt(quest.months));

    quest = {
      ...quest,
      endDate: newDate.toISOString()
    };
  }

  return {
    type: EDITING_QUEST_UPDATED,
    quest
  };
};
