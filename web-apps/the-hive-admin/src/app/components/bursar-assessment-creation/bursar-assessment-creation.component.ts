import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import * as moment from 'moment';
import { BursarAssessmentService } from '../../services/bursar-assessment.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

export const defaultNumberOfMonthsDueIn = 1;

@Component({
    selector: 'app-bursar-assessment-creation',
    templateUrl: './bursar-assessment-creation.component.html',
    styleUrls: ['./bursar-assessment-creation.component.css'],
    standalone: false
})
export class BursarAssessmentCreationComponent implements OnInit {
  nameFormControl = new UntypedFormControl('', [Validators.required, Validators.minLength(2)]);
  emailFormControl = new UntypedFormControl('', [Validators.required, Validators.email]);
  dueDateFormControl = new UntypedFormControl('', [Validators.required]);

  matcher = new MyErrorStateMatcher();

  defaultDueDate = moment().add(defaultNumberOfMonthsDueIn, 'M').toDate();

  constructor(private bursarAssessmentService: BursarAssessmentService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.dueDateFormControl.setValue(this.defaultDueDate);
  }

  validateDate() {
    if (moment().diff(this.dueDateFormControl.value) >= 0) {
      this.dueDateFormControl.setErrors({ invalidDate: true });
    }
  }

  inviteCandidate() {
    const bursarData = {
      name: this.nameFormControl.value,
      email: this.emailFormControl.value,
      dueDate: this.dueDateFormControl.value,
    };

    this.bursarAssessmentService.createNewBursarAssessment(bursarData).subscribe(
      (res) => {
        this.clearInputFields();
        this.snackBar.open('New invite created', 'Dismiss', { duration: 3000 });
      },
      (err) => {
        this.snackBar.open('Failed to create new invite', 'Dismiss', { duration: 3000 });
      }
    );
  }

  clearInputFields() {
    if(this.dueDateFormControl.touched){
       this.dueDateFormControl.setValue(this.defaultDueDate);
    }
    
    this.nameFormControl.reset();
    this.nameFormControl.markAsUntouched();
    this.emailFormControl.reset();
    this.emailFormControl.markAsUntouched();
  }
}
