const enum fileTypes {
  text = 'text/plain;charset=utf-8;',
  csv = 'text/csv;charset=utf-8;',
  pdf = 'application/pdf;',
}

enum contentTypeCodes {
  track,
  course,
  levelUp,
  sideQuest,
  sideQuestType,
  levelUpActivityType,
  group,
  programme,
}

const contentTypeLabel = new Map<number, string>([
  [contentTypeCodes.track, 'track'],
  [contentTypeCodes.course, 'course'],
  [contentTypeCodes.levelUp, 'levelUp'],
  [contentTypeCodes.sideQuest, 'sideQuest'],
  [contentTypeCodes.sideQuestType, 'sideQuestType'],
  [contentTypeCodes.levelUpActivityType, 'levelUpActivityType'],
  [contentTypeCodes.group, 'group'],
  [contentTypeCodes.programme, 'programme']
]);

export {fileTypes, contentTypeCodes, contentTypeLabel}