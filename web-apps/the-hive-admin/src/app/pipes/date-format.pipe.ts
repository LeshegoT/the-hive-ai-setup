import { Pipe, PipeTransform, Provider } from '@angular/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats } from '@angular/material/core';

@Pipe({
    name: 'dateFormat',
    standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return "";
    const userLocale = Intl.DateTimeFormat().resolvedOptions().locale; 
    return (new Date(value)).toLocaleString(userLocale, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  }
}

@Pipe({
    name: 'timeFormat',
    standalone: true
})
export class TimeFormatPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return "";
    const dateTime = new Date(value);
    const userLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    return (dateTime).toLocaleString(userLocale, {
      hour: 'numeric',
      minute: 'numeric'
    });
  }
}

@Pipe({
    name: 'timeFormatNoAdjust',
    standalone: false
})
export class TimeFormatNoAdjustPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return "";
    const userLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    return (new Date(value)).toLocaleString(userLocale, {
      hour: 'numeric',
      minute: 'numeric'
    });
  }
}

 export const DayMonthYearDateFormat = {
   parse: {
     dateInput: 'DD/MM/YYYY',
   },
   display: {
     dateInput: 'DD/MM/YYYY',
     monthYearLabel: 'MMMM YYYY',
     dateA11yLabel: 'LL',
     monthYearA11yLabel: 'MMMM YYYY',
   },
 };

export const localisedDateFormat: MatDateFormats = {
  parse: {
    dateInput: 'L',
  },
  display: {
    dateInput: 'L',
    monthYearLabel: 'LL',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'LL',
  },
}

export const provideMaterialDatePickerConfiguration: () => Provider[] = () => {
  return [
    { provide: MAT_DATE_LOCALE, useFactory: () => navigator.language },
    { provide: MAT_DATE_FORMATS, useValue: localisedDateFormat },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { strict: true, useUtc: false } },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_DATE_FORMATS, MAT_MOMENT_DATE_ADAPTER_OPTIONS] }
  ]
}