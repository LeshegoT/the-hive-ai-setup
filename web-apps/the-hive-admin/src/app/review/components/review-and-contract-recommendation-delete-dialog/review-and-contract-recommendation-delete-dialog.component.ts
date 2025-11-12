import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FeedbackService, ReviewCancellationReason } from '../../services/feedback.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Config } from '../../../shared/config';
import { ContractRecommendationCancellationReason, ContractsService } from '../../../contracts/services/contracts.service';
import { EnvironmentService } from '../../../services/environment.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-review-and-contract-recommendation-delete-dialog',
    templateUrl: './review-and-contract-recommendation-delete-dialog.component.html',
    styleUrls: ['./review-and-contract-recommendation-delete-dialog.component.css', '../../../shared/shared.css'],
    standalone: false
})
export class ReviewAndContractRecommendationDeleteDialogComponent implements OnInit {
  reviewCompletedFlag = false;
  reviewHasCompletedFeedbackFlag = false;
  deleteReviewForm: FormGroup;
  environmentConfig: Config;
  deleteType: 'Review' | 'Contract Recommendation';
  recommendationCancellationReasons$: Observable<ContractRecommendationCancellationReason[]>;
  reviewCancellationReasons$: Observable<ReviewCancellationReason[]>;
  constructor(
    public dialogRef: MatDialogRef<ReviewAndContractRecommendationDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public feedbackService: FeedbackService,
    public contractsService: ContractsService,
    public environmentService: EnvironmentService,
    private snackBar: MatSnackBar,
    private deleteReviewFormBuilder: FormBuilder,
  ) {
    this.deleteReviewForm = this.deleteReviewFormBuilder.group({
      selectedReason: ['', Validators.required],
      finalReason: [''],
      email: ['', Validators.compose([Validators.required, Validators.email, this.emailMatchValidator.bind(this)])]
    });

    this.deleteReviewForm.get('selectedReason').valueChanges.subscribe(value => {
      if (value.toLowerCase() === 'special case') {
        this.deleteReviewForm.get('finalReason').setValidators([Validators.required]);
      } else {
        this.deleteReviewForm.get('finalReason').clearValidators();
      }
      this.deleteReviewForm.get('finalReason').updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.dialogRef.disableClose = true;
    this.reviewCompletedFlag = this.data.status.toLowerCase() === 'completed';
    this.reviewHasCompletedFeedbackFlag = this.data.feedbackAssignments?.completed > 0;
    this.environmentConfig = this.environmentService.getConfiguratonValues();
    
    if (this.data.contractRecommendationId) {
      this.deleteType = 'Contract Recommendation';
      this.fetchContractRecommendationCancelReasons();
    } else {
      this.deleteType = 'Review';
      this.fetchReviewsCancellationReasons();
    }
  }

  onCancel() {
    this.dialogRef.close('cancelled');
  }

  onDelete() {
    if (this.deleteReviewForm.valid) {
      this.data.comment = this.deleteReviewForm.get('selectedReason').value.toLowerCase() === 'special case' 
        ? this.deleteReviewForm.get('finalReason').value 
        : this.deleteReviewForm.get('selectedReason').value;
      if (this.data.contractRecommendationId) {
        this.cancelContractRecommendation();
      } else {
        this.removeReview();
      }
    } else {
      this.deleteReviewForm.markAllAsTouched();
    }
  }
  getErrorMessage() {
    const email = this.deleteReviewForm.get('email');

    if (email.hasError('required')) {
      return 'Email is required';
    } else if (email.hasError('email')) {
      return 'Invalid email';
    } else {
      const email = this.deleteReviewForm.get('email').value?.toLowerCase();
      const reviewee = this.data.reviewee.toLowerCase();

      if (reviewee !== email) {
        this.deleteReviewForm.controls['email'].valid === false;
        return 'Email does not match reviewee';
      } else {
        return '';
      }
    }

  }

  removeReview() {
    this.feedbackService.deleteReview(this.data.id, this.data.review, this.data.comment).subscribe(
      () => {
        this.snackBar.open('Review Deleted', 'Dismiss', { duration: 3000 });
        this.dialogRef.close('deleted');
      },
      (err) => {
        this.snackBar.open(err, 'Dismiss', { duration: 3000 });
      }
    );
  }
  
  cancelContractRecommendation() {
    this.contractsService.updateContractRecommendation(this.data.contractRecommendationId, { status: this.data.contractRecommendationCancelStatus, recommendationCancelReason: this.data.comment }).subscribe({
      next: (_res) => {
        this.snackBar.open('The contract recommendation has been cancelled.', 'Dismiss', { duration: this.environmentConfig.SNACKBAR_DURATION });
        this.data.afterSuccess();
        this.dialogRef.close();
      },
      error: (_err) => {
        this.snackBar.open('We encountered an issue while trying to cancel the contract recommendation. Please try again.', 'Dismiss', { duration: this.environmentConfig.SNACKBAR_DURATION });
      }
    });
  }

  canSubmit() {
    return this.deleteReviewForm.valid && !this.deleteReviewForm.get('email').hasError('nomatch');
  }

  emailMatchValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value?.toLowerCase();
    const reviewee = this.data.reviewee.toLowerCase();
    if (email && email !== reviewee) {
      return { nomatch: true };
    }
    return null;
  }

  fetchContractRecommendationCancelReasons() {
    this.recommendationCancellationReasons$ = this.contractsService.getContractRecommendationCancelReasons();
  }

  fetchReviewsCancellationReasons(){
    this.reviewCancellationReasons$ = this.feedbackService.getReviewCancellationReasons();
  }
}
