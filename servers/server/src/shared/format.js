const formatDateOnly = (date) => {
  return date.toLocaleDateString('en-ZA');
};

const formatTime = (date) => {
  let dateTime = new Date(date);
  dateTime = dateTime.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return dateTime;
};

const addMinutesToDate = (date, minutes) => {
  return new Date(Date.parse(date) + minutes * 60000)
    .toISOString()
    .replace('Z', '');
};

const parseLocalDate = (dateString) => {
  if (!dateString) return;
  const date = new Date(dateString);
  return date;
};

module.exports = {
  formatDateOnly,
  formatTime,
  addMinutesToDate,
  parseLocalDate,
};
