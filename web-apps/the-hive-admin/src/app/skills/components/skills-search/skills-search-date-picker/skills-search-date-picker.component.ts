import { ChangeDetectionStrategy, Component, ViewEncapsulation, EventEmitter, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { CommonModule } from '@angular/common';
import { Input, Output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { OperatorSelectComponent } from '../operator-select/operator-select.component';
import { FieldFilter } from '../../../services/skills-search.types';
import { currentStringValue, createFieldFilterForRange, createFieldFilter, defaultOperator, rangeOperator } from '../../../services/skills-searchQuery.service';
import { MatNativeDateModule } from '@angular/material/core';
import * as _moment from 'moment';
import { default as _rollupMoment, Moment } from 'moment';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';

type DateFormat = 'YYYY' | 'YYYY-MM' | 'YYYY-MM-DD';

export const FORMATS_YYYY = {
  parse: { dateInput: 'YYYY' },
  display: { dateInput: 'YYYY', monthYearLabel: 'YYYY', dateA11yLabel: 'LL', monthYearA11yLabel: 'YYYY' },
};

export const FORMATS_YYYY_MM = {
  parse: { dateInput: 'YYYY-MM' },
  display: { dateInput: 'YYYY-MM', monthYearLabel: 'YYYY MMM', dateA11yLabel: 'LL', monthYearA11yLabel: 'YYYY MMMM' },
};

export const FORMATS_YYYY_MM_DD = {
  parse: { dateInput: 'YYYY-MM-DD' },
  display: { dateInput: 'YYYY-MM-DD', monthYearLabel: 'YYYY MMM', dateA11yLabel: 'LL', monthYearA11yLabel: 'YYYY MMMM' },
}

@Component({
    selector: 'skills-search-date-picker',
    templateUrl: './skills-search-date-picker.component.html',
    styleUrls: ['./skills-search-date-picker.component.css'],
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: DateAdapter,
            useClass: MomentDateAdapter,
            deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
        },
        {
            provide: MAT_DATE_FORMATS,
            useFactory: (datePickerComponent: SkillsSearchDatePickerComponent) => {
                switch (datePickerComponent.format) {
                    case 'YYYY':
                        return FORMATS_YYYY;
                    case 'YYYY-MM':
                        return FORMATS_YYYY_MM;
                    case 'YYYY-MM-DD':
                    default:
                        return FORMATS_YYYY_MM_DD;
                }
            },
            deps: [SkillsSearchDatePickerComponent],
        },
    ],
    imports: [
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        MatCheckboxModule,
        OperatorSelectComponent,
        MatNativeDateModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsSearchDatePickerComponent {
  @Input() labelName: string;
  @Input() fieldName: string;
  @Input() format: DateFormat = 'YYYY';
  @Input() hasCheckBox = false;
  @Input() attributeType: string;

  @Output() dateUpdated = new EventEmitter<FieldFilter>();

  range = false;
  checkBox = false;
  operator: string;
  errorMessage = signal(undefined);
  dateControl: FormControl = new FormControl(_moment());
  dateControlMinValue: FormControl = new FormControl(_moment());
  dateControlMaxValue: FormControl = new FormControl(_moment());

  selectYear(normalizedYear: Moment, datepicker: MatDatepicker<Moment>, type: string): void {
    const selectedYear = _moment(normalizedYear);
    const formControl = this.getDateControlByType(type);
    formControl.year(selectedYear.year());

    this.updateControl(formControl, type);
    if (this.format === 'YYYY') {
      datepicker.close();
      this.emitSelectedDate();
    }else{
      //do nothing
    }
  }

  // Handles month selection
  selectMonth(normalizedMonth: Moment, datepicker: MatDatepicker<Moment>, type: string): void {
    const selectedMonth = _moment(normalizedMonth);
    const formControl = this.getDateControlByType(type);
    formControl.month(selectedMonth.month());
    this.updateControl(formControl, type);

    if (this.format === 'YYYY-MM') {
      datepicker.close();
      this.emitSelectedDate();
    }else{
      //do nothing
    }
  }

  // Handles day selection
  selectDay(normalizedDay: Moment, datepicker: MatDatepicker<Moment>, type: string): void {
    const selectedDay = _moment(normalizedDay);
    const formControl = this.getDateControlByType(type);
    formControl.date(selectedDay.date());
    this.updateControl(formControl, type);
    if (this.format === 'YYYY-MM-DD') {
      datepicker.close();
      this.emitSelectedDate();
    }else{
      //do nothing
    }
  }

  getDateControlByType(type: string): Moment {
    let dateControl;
    if (type === 'start') {
      dateControl = _moment(this.dateControlMinValue.value);
    } else if (type === 'end') {
      dateControl = _moment(this.dateControlMaxValue.value);
    } else {
      dateControl = _moment(this.dateControl.value);
    }
    return dateControl;
  }

  updateControl(formControlValue: Moment, type: string): void {
    if (type === 'start') {
      this.dateControlMinValue.setValue(formControlValue);
    } else if (type === 'end') {
      this.dateControlMaxValue.setValue(formControlValue);
    }else{
      this.dateControl.setValue(formControlValue);
    }
  }

  emitSelectedDate(): void{
    if(this.operator === undefined){
      this.errorMessage.set('Please select an operator');
    }else{
      if(this.range){
        if(this.dateControlMinValue && this.dateControlMaxValue){
          if(this.dateControlMinValue.value.isBefore(this.dateControlMaxValue.value)){
            const rangeObject = createFieldFilterForRange(
              this.fieldName, 
              this.dateControlMinValue.value.format(this.format), 
              this.dateControlMaxValue.value.format(this.format)
            )
            this.errorMessage.set(undefined);
            this.dateUpdated.emit(rangeObject);
          }else{
            this.errorMessage.set('Start date must be before end date');
          }
          
        }else{
          this.errorMessage.set('Please finish the date range');
        }
  
      }else{
        const formattedDate = this.dateControl.value.format(this.format);
        const fieldObject = createFieldFilter(this.fieldName, { [this.operator]: formattedDate});
        this.dateUpdated.emit(fieldObject);
      }
    } 
    
  }

  checkBoxHandler(event: MatCheckboxChange) {
    this.checkBox = event.checked
    if (this.checkBox) {
      const attributeParameters = createFieldFilter(this.fieldName, { [defaultOperator]: currentStringValue });
      this.dateUpdated.emit(attributeParameters);
    }else{
      //don't need to do anything
    }
  }

  handleKeyDown(event: KeyboardEvent, type: string): void {
    const allowedKeys = /^[0-9.]$/; 
    const navigationKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab', '-'];
    
    if (!allowedKeys.test(event.key) && !navigationKeys.includes(event.key)) {
      event.preventDefault();
    }
    
    const input = (event.target as HTMLInputElement).value;
    
    const parsedDate = _moment(input, this.format, true);
    
    if (parsedDate.isValid()) {
      this.errorMessage.set(undefined); 
      this.updateControl(parsedDate, type); 
    } else {
      this.errorMessage.set('Please input a valid date'); 
    }
  }

  onOperatorSelected(operator: string){
    this.operator = operator;
    this.errorMessage.set(undefined);
    if(this.operator == rangeOperator){
      this.range = true;
    }else{
      this.range = false;
    }

    if(this.dateControl.value != null || this.dateControlMinValue.valid != null || this.dateControlMaxValue.value != null){
      this.emitSelectedDate();
    }else{
      //do nothing because date has not been selected
    }
  }

}



