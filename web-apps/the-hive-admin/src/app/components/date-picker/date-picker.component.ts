import { Component, OnInit, Output, Input, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module and we thus need to import it using
// the `default as` syntax.
import * as _moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports
// import { default as _rollupMoment } from 'moment';
import { Subscription } from 'rxjs';

// const moment = _rollupMoment || _moment;
const moment = _moment;

// See the Moment.js docs for the meaning of these formats:
// https://momentjs.com/docs/#/displaying/format/
export const MY_FORMATS = {
  parse: {
    dateInput: 'LL'
  },
  display: {
    dateInput: 'LL',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};
@Component({
    selector: 'app-date-picker',
    templateUrl: './date-picker.component.html',
    styleUrls: ['./date-picker.component.css'],
    providers: [
        {
            provide: DateAdapter,
            useClass: MomentDateAdapter,
            deps: [MAT_DATE_LOCALE]
        },
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }
    ],
    standalone: false
})
export class DatePickerComponent implements OnInit, OnDestroy {
  date = new UntypedFormControl(moment());
  dateChanges: Subscription;
  @Output() dateValue = new EventEmitter<Date>();
  @Input() initDate: Date = new Date();
  @Input() minDate: Date;

  ngOnInit() {
    this.date.setValue(this.initDate);
    this.dateChanges = this.date.valueChanges.subscribe((newDate) => {
      this.dateValue.emit(newDate.toDate());
    });
  }

  ngOnDestroy() {
    this.dateChanges.unsubscribe();
  }
}
