import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';

@Component({
    selector: 'app-review-and-contract-hold-details-dialog',
    templateUrl: './review-and-contract-hold-details-dialog.component.html',
    styleUrls: ['./review-and-contract-hold-details-dialog.component.css'],
    imports: [
        CommonModule,
        MatButtonModule,
        DateFormatPipe
    ]
})

export class ReviewAndContractHoldDetailsDialogComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<ReviewAndContractHoldDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      holdReasonText: string,
      onHoldByText: string;
      placedOnHoldDate?: Date;
    }
  ) {}

  ngOnInit() {
    this.dialogRef.disableClose = false;
  }

  close() {
    this.dialogRef.close();
  }
}
