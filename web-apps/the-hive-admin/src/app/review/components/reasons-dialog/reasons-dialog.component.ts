import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FeedbackService } from '../../../review/services/feedback.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, Validators } from '@angular/forms';

@Component({
    selector: 'app-reasons-dialog',
    templateUrl: './reasons-dialog.component.html',
    styleUrls: ['./reasons-dialog.component.css', '../../../shared/shared.css'],
    standalone: false
})
export class ReasonsDialogComponent implements OnInit {
    constructor(
    public dialogRef: MatDialogRef<ReasonsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar
    ) {}

    ngOnInit() {
        this.dialogRef.disableClose = true;
    }

    onSubmitReason() {
        if(this.data.possibleReasons.includes(this.data.selectedReason)){
        this.submitReason(this.data.selectedReason);
        }else{
        this.submitReason(this.data.finalReason);
        }
    }

    submitReason(comment: string){
        this.dialogRef.close("Submitted");
        this.data.afterSuccess(comment);
    }

    onCancel(){
        this.dialogRef.close();
    }

    specialCaseIsValid() {
        return !!this.data.finalReason && this.data.finalReason.length>0;
    }

    canSubmit() {
        return this.data.possibleReasons.includes(this.data.selectedReason)
            || this.specialCaseIsValid();
    }
}