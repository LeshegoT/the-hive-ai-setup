import { Component, Inject, OnInit, OnChanges } from '@angular/core';
import { FormControl, FormGroup, UntypedFormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FeedbackService } from '../../../review/services/feedback.service';

@Component({
    selector: 'app-hr-rep-selection-dialog',
    templateUrl: './hr-rep-selection-dialog.component.html',
    styleUrls: ['./hr-rep-selection-dialog.component.css', '../../styles/reviewShared.css'],
    standalone: false
})
export class HrRepSelectionDialogComponent implements OnInit, OnChanges{
  allReps;
  minimalAmountOfRepsWarning = "";

  constructor(
    private formBuilder: UntypedFormBuilder,
    public feedbackService: FeedbackService,
    public dialogRef: MatDialogRef<HrRepSelectionDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.allReps = (Object.keys(this.data))
      .filter((repGroupName) => this.data[repGroupName].reps !== undefined)
      .map(repGroupName =>{ 
        const rep = {
          checkboxes: this.createRepGroupCheckboxForm(this.data[repGroupName].reps),
          reps: this.data[repGroupName].reps,
          heading: this.data[repGroupName].heading
        }
        return rep;
    })
  }

  ngOnInit(){
    this.dialogRef.disableClose = true;
  }

  ngOnChanges() {
    this.minimalAmountOfRepsWarning = "";
  }

  closeDialog(){
    this.dialogRef.close();
  }

  assignReviews() {
    const returnedReps = [];
    this.minimalAmountOfRepsWarning = "";
    for (const repGroup of this.allReps) {
      returnedReps.push(Object.keys(repGroup.checkboxes.value).filter((rep) => repGroup.checkboxes.value[rep]))
    }
    const numberOfRepsSelected = returnedReps.reduce((total, repGroup) => total + repGroup.length, 0);
    if(numberOfRepsSelected >= 2){
      this.dialogRef.close(returnedReps);
    }else if(numberOfRepsSelected === 1){
      this.minimalAmountOfRepsWarning = "You have selected only one HR Rep, are you sure?"
    }else{
      this.snackBar.open('Please select at least one HR Representative', 'Dismiss', { duration: 3000 });
    }
  }

  reviewsConfirmed(){
    const returnedReps = [];
    for (const repGroup of this.allReps) {
      returnedReps.push(Object.keys(repGroup.checkboxes.value).filter((rep) => repGroup.checkboxes.value[rep]))
    }
    this.dialogRef.close(returnedReps);
  }

  createRepGroupCheckboxForm<T extends string>(reps: T[], checkboxState = true): FormGroup<Record<T, FormControl<boolean>>> {
    const formControls: Record<T, FormControl<boolean>> = {} as Record<T, FormControl<boolean>>;

    for (const rep of reps) {
        formControls[rep] = new FormControl(checkboxState);
    }  
    return this.formBuilder.group(formControls);
  }
}
