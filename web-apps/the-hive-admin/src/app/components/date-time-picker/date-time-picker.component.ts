import { Component, Input, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import {
  ControlValueAccessor,
  UntypedFormBuilder,
  UntypedFormGroup,
  NgControl,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { DateAdapter, NativeDateAdapter } from '@angular/material/core';
import { MatFormFieldControl } from '@angular/material/form-field';

@Component({
    selector: 'app-date-time-picker',
    templateUrl: './date-time-picker.component.html',
    styleUrls: ['./date-time-picker.component.css'],
    providers: [
        { provide: DateAdapter, useClass: NativeDateAdapter },
        { provide: MatFormFieldControl, useExisting: DateTimePickerComponent },
    ],
    standalone: false
})
export class DateTimePickerComponent
  implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy {
  @Input() allowPastDate: any = false; //flag to allow past dates
  @Input() min: Date = new Date(); //value the min date will be at, leave blank for the current date
  @Input() date: Date = new Date(); //value the date picker will start at
  @Input() label: string;

  errorState = false;
  dateForm: UntypedFormGroup;

  constructor(private formBuilder: UntypedFormBuilder, public ngControl: NgControl) {
    ngControl.valueAccessor = this;
    this.dateForm = this.formBuilder.group(
      {
        date: [new Date(), Validators.required],
        time: ['09:00', Validators.required],
      },
      { validators: ValidTime }
    );
  }
  ngAfterViewInit(): void {
    this.ngControl.statusChanges.subscribe((status) => this.updateFields(status));
    this.dateForm.markAllAsTouched();
    this.ngControl.control.updateValueAndValidity();
  }
  writeValue(newDate: Date): void {
    if (newDate != undefined) {
      this.date = newDate;
      this.dateForm.controls['date'].setValue(this.date);
      const hours = `${this.date.getHours()}`.padStart(2, '0');
      const minutes = `${this.date.getMinutes()}`.padStart(2, '0');
      const time = hours + ':' + minutes;
      this.dateForm.controls['time'].setValue(time);
      this.updateTime(time);
    }
  }
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {}

  updateFields(status) {
    if (status == 'INVALID') {
      this.errorState = true;
      this.dateForm.setErrors({
        invalidInput: this.date,
        message: 'Invalid Date/Time',
      });
      this.dateForm.controls['date'].setErrors({
        invalidInput: this.date,
        message: 'Invalid Date/Time',
      });
      this.dateForm.controls['time'].setErrors({
        invalidInput: this.date,
        message: 'Invalid Date/Time',
      });
    } else {
      this.errorState = false;
      this.dateForm.setErrors(null);
      this.dateForm.controls['date'].setErrors(null);
      this.dateForm.controls['time'].setErrors(null);
    }
  }

  propagateChange = (_: any) => {};
  onTouched = () => {};

  ngOnInit() {
    this.dateForm.controls['date'].setValue(this.date);
    const hours = `${this.date.getHours()}`.padStart(2, '0');
    const minutes = `${this.date.getMinutes()}`.padStart(2, '0');
    const time = hours + ':' + minutes;
    this.dateForm.controls['time'].setValue(time);
  }

  ngOnDestroy() {}

  updateTime($event) {
    const timeValue = $event.split(':');
    this.date.setHours(timeValue[0], timeValue[1], 0);
    this.dateForm.markAllAsTouched();
    this.propagateChange(this.date);
  }

  inputDate(input, $event) {
    this.date = $event.value;
    this.dateForm.markAllAsTouched();
    this.updateTime(this.dateForm.controls['time'].value);
  }
}

const ValidTime: ValidatorFn = (form: UntypedFormGroup) => {
  const valid = form.controls['date'].valid;
  if (valid) {
    return null;
  } else {
    form.controls['time'].setErrors({
      invalidInput: form.controls['time'].value,
      message: 'Invalid Date/Time',
    });
    return {
      invalidInput: form.controls['date'].value,
      message: 'Invalid Date/Time',
    };
  }
};
