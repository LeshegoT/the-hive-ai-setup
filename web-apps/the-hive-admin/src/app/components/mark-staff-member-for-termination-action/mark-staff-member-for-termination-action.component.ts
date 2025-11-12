import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject, catchError, filter, map, merge, Observable, of, shareReplay, startWith, Subject, Subscription, switchMap } from 'rxjs';
import { OffboardingStaffService } from '../../people/components/offboarding/offboarding-staff.service';
import { provideMaterialDatePickerConfiguration } from '../../pipes/date-format.pipe';
import { ReviewFilterParameters } from '../../review/review-filter-parameters';
import { FeedbackService } from '../../review/services/feedback.service';
import { EnvironmentService } from '../../services/environment.service';
import { StaffOverviewService } from '../../review/services/staff-overview.service';
import { Person } from '../../shared/interfaces';

export type MarkStaffMemberForTerminationResult =
  | { status: 'success' }
  | { status: 'error', error: string }
  | { status: 'loading' }

type RetrieveActiveReviewsForUserResult =
  | { status: 'success', hasActiveReviews: boolean, ownsActiveReview: boolean }
  | { status: 'error', error: string }
  | { status: 'loading' }

@Component({
  selector: 'app-mark-staff-member-for-termination-action',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  providers: [
    provideMaterialDatePickerConfiguration(),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        subscriptSizing: 'dynamic'
      }
    }
  ],
  templateUrl: './mark-staff-member-for-termination-action.component.html',
  styleUrls: ['./mark-staff-member-for-termination-action.component.css']
})
export class MarkStaffMemberForTerminationActionComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) userPrincipalName: string;
  @Input({ required: true }) skipActiveReviewsCheck = false;
  @Output() staffMemberMarkedForTermination = new EventEmitter<void>();

  terminationEnabled = false;
  loggedInUserHasManageStaffPermissions$: Observable<boolean>;
  selectedStaffMemberIsActive$ = new BehaviorSubject<boolean>(true);

  private readonly markStaffMemberForTermination$ = new Subject<string>();
  markStaffMemberForTerminationResult$: Observable<MarkStaffMemberForTerminationResult>;
  staffMemberHasActiveOrOwnsReview$: Observable<RetrieveActiveReviewsForUserResult>;
  staffMember$: Observable<Person>;
  private subscription = new Subscription();
  private resetErrorsAndFetchActiveReviews$ = new Subject<void>();

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly offboardingStaffService: OffboardingStaffService,
    private readonly feedbackService: FeedbackService,
    private readonly staffOverviewService: StaffOverviewService
  ) {}

  ngOnInit(): void {
    this.terminationEnabled = this.environmentService.getConfiguratonValues().TERMINATION_ENABLED;
    this.loggedInUserHasManageStaffPermissions$ = this.offboardingStaffService.loggedInUserHasManageStaffPermissions();
    this.initialiseMarkStaffMemberForTerminationObservable();
    this.initialiseStaffMemberHasActiveReviewObservable();
  }

  initialiseMarkStaffMemberForTerminationObservable(): void {
    this.markStaffMemberForTerminationResult$ = merge(this.markStaffMemberForTermination$, this.resetErrorsAndFetchActiveReviews$).pipe(
      switchMap((staffMemberUPNToMarkForTermination) => {
        if (staffMemberUPNToMarkForTermination) {
          return this.offboardingStaffService.markStaffMemberAsPendingDelete(staffMemberUPNToMarkForTermination).pipe(
            map(() => ({ status: 'success' } as const)),
            catchError((error: string) => of({ status: 'error', error: error } as const)),
            startWith({ status: 'loading' } as const)
          );
        } else {
          return of(undefined);
        }
      }),
      shareReplay(1)
    );

    this.subscription.add(
      this.markStaffMemberForTerminationResult$.pipe(
        filter(result => result && result.status === "success")
      ).subscribe(() => {
        this.selectedStaffMemberIsActive$.next(false);
        this.staffMemberMarkedForTermination.emit();
      })
    );
  }

  initialiseStaffMemberHasActiveReviewObservable(): void {
    if (this.skipActiveReviewsCheck) {
      // Parent component should already have some way of ensuring that the staff member has no active reviews
      // For example, the "Upcoming Reviews" tab only shows reviews that have not yet been started and therefore there is no need to check for active reviews
    } else {
      this.staffMemberHasActiveOrOwnsReview$ = this.resetErrorsAndFetchActiveReviews$.pipe(
        startWith(undefined),
        switchMap(() => this.getActiveOrOwnedReviewsForStaffMember()),
        shareReplay(1)
      );

      this.staffMember$ = this.resetErrorsAndFetchActiveReviews$.pipe(
        startWith(undefined),
        switchMap(() => this.staffOverviewService.getStaffOnRecord(this.userPrincipalName))
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userPrincipalName']) {
      this.resetErrorsAndRefetchActiveReviews();
    } else {
      // No action needed for other changes
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  markStaffMemberForTermination(_event: MouseEvent, userPrincipalName: string): void {
    this.markStaffMemberForTermination$.next(userPrincipalName);
  }

  resetErrorsAndRefetchActiveReviews(): void {
    this.selectedStaffMemberIsActive$.next(true);
    this.resetErrorsAndFetchActiveReviews$.next();
  }

  private getActiveOrOwnedReviewsForStaffMember(): Observable<RetrieveActiveReviewsForUserResult> {
    const filterParameters: ReviewFilterParameters = {
      statusId: undefined,
      createdBy: undefined,
      from: undefined,
      to: undefined,
      searchText: this.userPrincipalName,
      archived: false,
      selectedReviewTypeIds: undefined,
      selectedStatusIds: undefined
    };

    const page = 1;
    const pageSize = 1;

    return this.feedbackService.getAllReviews(page, pageSize, filterParameters).pipe(
      map(pagedResult => pagedResult.data.filter(review => review.reviewee === this.userPrincipalName || review.hrRep === this.userPrincipalName)),
      map(reviews => ({
        status: 'success',
        hasActiveReviews: reviews.some(review => review.reviewee === this.userPrincipalName),
        ownsActiveReview: reviews.some(review => review.hrRep === this.userPrincipalName)
      } as const)),
      catchError((error) => of({ status: 'error', error: String(error) } as const)),
      startWith({ status: 'loading' } as const),
      shareReplay(1)
    );
  }

  getTooltipText(hasActiveReviews: boolean, ownsActiveReview: boolean, staffMemberName = 'Staff member'): string {
    if (hasActiveReviews) {
      return `Cannot mark for termination. ${staffMemberName} has an active review.`;
    } else if (ownsActiveReview) {
      return `Cannot mark for termination. ${staffMemberName} is currently assigned as the HR Rep for an active review.`;
    } else {
      return 'Mark for termination';
    }
  }

}
