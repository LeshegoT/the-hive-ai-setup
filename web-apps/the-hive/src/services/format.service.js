
export const parseLocalDate = (dateString) => {
  return new Date(dateString);
};

export const parseISOFormatDate = (dateString) => {
  return new Date(dateString);
}

export const formatDate = (date) => {
  if (!date) return;

  let userLocale = Intl.DateTimeFormat().resolvedOptions().locale; 

  return date.toLocaleString(userLocale,{
    day: 'numeric',
    month: 'short'
  });
};

export const formatFullDate = (date) => {
  if (!date) return;

  let userLocale = Intl.DateTimeFormat().resolvedOptions().locale; 

  return date.toLocaleString(userLocale,{
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
export const formatFullDateTime = (date) => {
  if (!date) return;

  let userLocale = Intl.DateTimeFormat().resolvedOptions().locale; 

  return date.toLocaleString(userLocale,{
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
};

export const formatNumericDate = (date) => {
  if (!date) return;

  let userLocale = Intl.DateTimeFormat().resolvedOptions().locale; 

  return date.toLocaleString(userLocale,{
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  if (!date) return;

  let userLocale = Intl.DateTimeFormat().resolvedOptions().locale; 

  return date.toLocaleString(userLocale,{
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: 'numeric',

  });

};

export const formatDateTimeLocale = (date) => {
  if (!date) return;

  let userLocale = Intl.DateTimeFormat().resolvedOptions().locale; 

  return date.toLocaleString(userLocale,{
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
};

export const formatWeekDayDateTimeLocale = (date) => {
  let userLocale = Intl.DateTimeFormat().resolvedOptions().locale;

  return date.toLocaleString(userLocale,{
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',    
  });
};

export const formatFullLongDate = (date) => {
  let userLocale = Intl.DateTimeFormat().resolvedOptions().locale; 

  return date.toLocaleString(userLocale,{
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export const formatDateTimeHoursMinutes = (date) => {
  let userLocale = Intl.DateTimeFormat().resolvedOptions().locale; 

  return date.toLocaleString(userLocale,{
    hour: 'numeric',
    minute: 'numeric',
  });
};