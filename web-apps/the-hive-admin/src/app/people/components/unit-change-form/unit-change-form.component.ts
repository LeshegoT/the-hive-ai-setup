import { CommonModule } from '@angular/common';
import { Component, effect, input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import moment, { Moment } from 'moment';
import { BehaviorSubject, catchError, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ReviewFilterParameters } from '../../../review/review-filter-parameters';
import { FeedbackService, Review } from '../../../review/services/feedback.service';
import { EnvironmentService } from '../../../services/environment.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import {UNIT_MOVE_REVIEW_TEMPLATE_NAME} from '@the-hive/lib-reviews-shared';
import { MatCardModule } from '@angular/material/card';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';
import { Person } from '../../../shared/interfaces';

type UnitChangeReviewForm = {
  unitChangeReviewDeadline: FormControl<Moment>;
};

@Component({
  selector: 'app-unit-change-form',
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule
  ],
  providers: [
    provideMaterialDatePickerConfiguration()
  ],
  templateUrl: './unit-change-form.component.html',
  styleUrls: ['./unit-change-form.component.css']
})
export class UnitChangeFormComponent implements OnDestroy {
  selectedStaffMember = input<Person>();
  unitChangeReviewForm: FormGroup<UnitChangeReviewForm>;
  unitChangeReviewCreating$ = new BehaviorSubject<boolean>(false);
  cancelPendingUnitChangeReviewsRequest$ = new Subject<void>();
  unitChangeReviewError$ = new BehaviorSubject<string>(undefined);
  activeUnitChangeReview$ = new BehaviorSubject<Review>(undefined);
  fetchingUnitChangeReview$ = new BehaviorSubject<boolean>(false);
  minimumUnitChangeReviewDate = moment();

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly feedbackService: FeedbackService,
    private readonly snackBar: MatSnackBar
  ) {
    const defaultUnitChangeReviewDeadline = moment().add(this.environmentService.getConfiguratonValues().UNIT_CHANGE_REVIEW_DEADLINE_DAYS, 'days');
    this.unitChangeReviewForm = new FormGroup({
      unitChangeReviewDeadline: new FormControl<Moment>(defaultUnitChangeReviewDeadline, { nonNullable: true }),
    });
    effect(() => {
      const currentUpn = this.selectedStaffMember();
      if (currentUpn) {
        this.getActiveUnitChangeReview();
      } else {
        this.resetErrorAndFetchedStateForUnitChangeReviews();
      }
    });
  }

  ngOnDestroy(): void {
    this.cancelPendingUnitChangeReviewsRequest$.next();
  }

  getActiveUnitChangeReview() {
    this.fetchingUnitChangeReview$.next(true);
    this.resetErrorAndFetchedStateForUnitChangeReviews();

    this.feedbackService.getFeedbackAssignmentTemplates().pipe(
      switchMap(templates => {
        const unitChangeReviewTemplateId: number = templates.find(template => template.templateName === UNIT_MOVE_REVIEW_TEMPLATE_NAME).feedbackAssignmentTemplateId;
        return this.getActiveUnitChangeReviewsForUpn(unitChangeReviewTemplateId)
      }),
    ).subscribe((reviewsForUpn) => {
      const activeUnitChangeReview = reviewsForUpn.reviews.data.find((review: Review) => 
        review.reviewee.toLowerCase() === this.selectedStaffMember().userPrincipleName.toLowerCase()
      );
      this.activeUnitChangeReview$.next(activeUnitChangeReview);
      this.fetchingUnitChangeReview$.next(false);
    });
  }

  resetErrorAndFetchedStateForUnitChangeReviews() {
    this.unitChangeReviewError$.next(undefined);
    this.activeUnitChangeReview$.next(undefined);
  }

  getActiveUnitChangeReviewsForUpn(unitChangeReviewTemplateId: number) {
    const reviewFilterParameters: ReviewFilterParameters = {
      statusId: undefined,
      createdBy: undefined,
      from: undefined,
      to: undefined,
      searchText: this.selectedStaffMember().userPrincipleName,
      archived: false,
      selectedReviewTypeIds: [unitChangeReviewTemplateId],
      selectedStatusIds: undefined,
    };
    const currentPage = 1;
    const currentPageSize = 1;
    return this.feedbackService.getAllReviews(currentPage, currentPageSize, reviewFilterParameters).pipe(
      takeUntil(this.cancelPendingUnitChangeReviewsRequest$),
      map(reviews => ({ upn: this.selectedStaffMember().userPrincipleName, reviews })),
      catchError((error) => {
        this.unitChangeReviewError$.next(error);
        this.activeUnitChangeReview$.next(undefined);
        return of({ upn: this.selectedStaffMember().userPrincipleName, reviews: { data: [] } });
      })
    );
  }

  createUnitChangeReview(reviewDeadline: Moment) {
    if (this.unitChangeReviewForm.invalid) {
      this.snackBar.open('Please set an appropriate review deadline', 'Close', { duration: this.environmentService.getConfiguratonValues().SNACKBAR_DURATION });
    } else {
      this.unitChangeReviewCreating$.next(true);
      this.feedbackService.createUnitChangeReview(this.selectedStaffMember().userPrincipleName, reviewDeadline.toDate()).subscribe({
        next: () => {
          this.unitChangeReviewCreating$.next(undefined);
          this.getActiveUnitChangeReview();
          this.snackBar.open('Unit move review created successfully', 'Close', { duration: this.environmentService.getConfiguratonValues().SNACKBAR_DURATION });
        },
        error: (error) => {
          this.unitChangeReviewError$.next(error);
          this.unitChangeReviewCreating$.next(undefined);
        }
    });
    }
  }

  generateSupportEmail(selectedStaffMember: Person, unitChangeReviewError: string) {
    const subject = encodeURIComponent(`Unit Move Review Error for ${selectedStaffMember.displayName}`);
    const emailBody = encodeURIComponent(`Hi team, \n\n I'm having an issue with the unit move review for ${selectedStaffMember.displayName}. \n\n The error message is: ${unitChangeReviewError} \n\nKind regards,\n`);
    return `mailto:reviews-support@bbd.co.za?subject=${subject}&body=${emailBody}`;
  }

}
