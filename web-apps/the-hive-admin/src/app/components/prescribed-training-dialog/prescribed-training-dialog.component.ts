import { Component, Inject, OnInit} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
    selector: 'app-prescribed-training-dialog',
    templateUrl: './prescribed-training-dialog.component.html',
    styleUrls: ['./prescribed-training-dialog.component.css'],
    standalone: false
})
export class PrescribedTrainingDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<PrescribedTrainingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {message: string, heading: string, disableButton: boolean},
  ) {}

  public setProperties(insertMessage, insertHeading, insertDisableButton){
    this.data = { message:insertMessage, heading: insertHeading, disableButton: insertDisableButton };
  }
  
  ngOnInit() {
    this.dialogRef.disableClose = true;
  }
}
