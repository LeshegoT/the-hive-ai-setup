import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-review-report-dialog',
    templateUrl: './review-report-dialog.component.html',
    styleUrls: [],
    standalone: false
})
export class ReviewReportDialogComponent implements OnInit {
  activeReview;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ReviewReportDialogComponent>
  ) {}

  ngOnInit() {
    this.dialogRef.disableClose = true;
    const structuredReview = {reviewee: this.data.review.userPrincipleName, reviewID : this.data.review.reviewId, template: {name : this.data.review.templateName}};
    this.activeReview = structuredReview;
  }

  toggleGenerateReportMode(cancelledReportDownload: boolean) {
    this.dialogRef.close(cancelledReportDownload);
  }
}
