import { AbstractControl, FormControl, UntypedFormControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { findOverlappingDateRanges } from '@the-hive/lib-shared';
import moment, { Moment } from 'moment';

export function CheckDateAndTime(allowPastDates): ValidatorFn {
  return (form: UntypedFormControl) => {
    if (allowPastDates) {
      return null;
    }
    const date = form.value;
    if (date == undefined) {
      return {
        invalidInput: form.value,
        message: 'Invalid date/time selected',
      };
    } else {
      const currentTime = new Date();

      if (currentTime.getTime() >= date.getTime()) {
        return {
          invalidInput: form.value,
          message: 'Invalid date/time selected',
        };
      } else {
        return null;
      }
    }
  };
}

export function maxOrMinDateValidator(maxOrMinDate: Date, isMax: boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors => {
    const value = control.value;
    if (!value) return undefined;
    else if (isMax) {
      return value > maxOrMinDate ? { maxDate: { maxOrMinDate } } : undefined;
    }
    else {
      return value < maxOrMinDate ? { minDate: { maxOrMinDate } } : undefined;
    }
  };
}

export function nonOverlappingDateRangesValidator<DateType extends Date | Moment>(
  startDateControl: FormControl<DateType>, 
  endDateControl: FormControl<DateType>, 
  otherDateRanges: { startDate: DateType, endDate: DateType }[]
): ValidatorFn {
  return (): ValidationErrors => {
    const newStartDate = moment(startDateControl.value);
    const newEndDate = moment(endDateControl.value);
    
    if (newStartDate.isAfter(newEndDate)) {
      return { rangeStartAfterRangeEnd: true };
    } else {
      const overlappingRanges = findOverlappingDateRanges(
        newStartDate,
        newEndDate,
        otherDateRanges.map((item) => ({ ...item, startDate: moment(item.startDate), endDate: moment(item.endDate) }))
      );

      if (overlappingRanges.length > 0) {
        return { overlap: true };
      } else {
        return undefined;
      }
    }
  }
}