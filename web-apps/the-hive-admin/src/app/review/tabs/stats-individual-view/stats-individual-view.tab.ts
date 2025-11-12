import { Component, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as moment from 'moment';
import { StaffFilterComponent } from '../../../components/staff-filter/staff-filter.component';
import { FeedbackService, HistoricalFeedback } from '../../../review/services/feedback.service';
import { ReportService } from '../../../services/report.service';
import { DateRangeFilter, Person, ReviewFeedback, VoluntaryFeedback } from '../../../shared/interfaces';

import { BehaviorSubject, catchError, combineLatest, EMPTY, filter, finalize, map, merge, mergeMap, Observable, of, shareReplay, switchMap } from 'rxjs';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { EnvironmentService } from '../../../services/environment.service';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';





export interface FeedbackViewFilter {
  assigned: boolean;
  voluntary: boolean;
  archived: boolean;
}

export interface DepartmentManager {
  department: string;
  manager: string;
  startDate: Date;
}
@Component({
    selector: 'app-stats-individual-view',
    templateUrl: './stats-individual-view.tab.html',
    styleUrls: ['./stats-individual-view.tab.css'],
    standalone: false,
    providers: [provideMaterialDatePickerConfiguration()],
})
export class StatsIndividualViewComponent implements OnInit {
  @ViewChild(StaffFilterComponent) staffFilterComponent: StaffFilterComponent;

  loading = false;
  reviewColumns = ['Author', 'DateCreated', 'Feedback'];
  static readonly VOLUNTARY_FEEDBACK_TEMPLATE = 'Voluntary Feedback';

  dateRangeFilter$: BehaviorSubject<DateRangeFilter> = new BehaviorSubject({ from: undefined, to: undefined });
  chosenTemplateName$: BehaviorSubject<string> = new BehaviorSubject(undefined);
  selectedStaffMember$: BehaviorSubject<Person> = new BehaviorSubject(undefined);
  userFeedback$: Observable<HistoricalFeedback>;
  filtersWithUserFeedback$: Observable<{
    dateRange: DateRangeFilter, 
    templateName: string, 
    userFeedback: HistoricalFeedback
  }>;

  reviewFeedback$: Observable<ReviewFeedback[]>;
  voluntaryFeedback$: Observable<VoluntaryFeedback[]>;
  completedFeedbackTemplateNamesForStaffMember$: Observable<string[]>;

  constructor(
    private feedbackService: FeedbackService,
    public reportService: ReportService,
    private _snackBar: MatSnackBar,
    private environmentService: EnvironmentService
  ) {  }

  ngOnInit () {
    this.userFeedback$ = this.selectedStaffMember$.pipe(
      filter(selectedStaffMember => !!selectedStaffMember),
      switchMap(selectedStaffMember => this.getUserFeedback(selectedStaffMember)),
    );

    this.filtersWithUserFeedback$ = combineLatest({
      dateRange: this.dateRangeFilter$,
      templateName: this.chosenTemplateName$,
      userFeedback: this.userFeedback$
    });

    this.reviewFeedback$ = this.filtersWithUserFeedback$.pipe(
      map(({dateRange, templateName, userFeedback}) => {
        const reviewFeedbackFilteredByDateRange = this.filterReviewFeedbackByDateRange(userFeedback?.assigned, dateRange);
        const reviewFeedbackFilteredByDateRangeAndTemplate = this.filterReviewFeedbackByTemplate(reviewFeedbackFilteredByDateRange, templateName);
        return reviewFeedbackFilteredByDateRangeAndTemplate;
      })
    );

    this.voluntaryFeedback$ = this.filtersWithUserFeedback$.pipe(
      map(({dateRange, templateName, userFeedback}) => {
        const voluntaryFeedbackFilteredByDateRange = this.filterVoluntaryFeedbackByDateRange(userFeedback?.voluntary, dateRange);
        const voluntaryFeedbackFilteredByDateRangeAndTemplate = this.filterVoluntaryFeedbackByTemplate(voluntaryFeedbackFilteredByDateRange, templateName);
        return voluntaryFeedbackFilteredByDateRangeAndTemplate;
      })
    );

    this.completedFeedbackTemplateNamesForStaffMember$ = this.userFeedback$.pipe(
      map(this.extractCompletedTemplateNames)
    );
  }

  private extractCompletedTemplateNames(userFeedback?: HistoricalFeedback) {
    const completedTemplateNames: string[] = [];

    const completedAssignedFeedbackTemplates = Array.from(
      new Set(userFeedback?.assigned.map((assignedReview) => assignedReview.review.template))
    );

    completedTemplateNames.push(...completedAssignedFeedbackTemplates);

    const staffMemberHasVoluntaryFeedback = !!userFeedback?.voluntary?.length;
    if (staffMemberHasVoluntaryFeedback) {
      completedTemplateNames.push(StatsIndividualViewComponent.VOLUNTARY_FEEDBACK_TEMPLATE);
    } else {
      // we only want to keep track of templates names for filtering purposes. We don't need to show a user a filter that does nothing.
    }

    const staffMemberHasCompletedTemplateNames = !!completedTemplateNames.length;
    if (staffMemberHasCompletedTemplateNames) {
      this?.chosenTemplateName$.next(completedTemplateNames[0]);
    } else {
      // if there are no template names for this staff member, we cannot filter by anything, so don't set a default.
    }
    return completedTemplateNames;
  }

  getUserFeedback (selectedStaffMember: Person) {
    return this.feedbackService.getUserFeedback(selectedStaffMember.userPrincipleName).pipe(
      finalize(() => this.loading = false),
      catchError(message => {
        this.openSnackBar(message);
        return of(undefined);
      }),
    );
  }

  selectStaff() {
    this.loading = true;
    this.selectedStaffMember$.next(this.staffFilterComponent.selectedUserPrinciple);
  }

  filterReviewFeedbackByTemplate(reviewFeedback: ReviewFeedback[] = [], template: string) {
    return reviewFeedback.filter(feedback => feedback.review.template === template);
  }

  filterVoluntaryFeedbackByTemplate(voluntaryFeedback: VoluntaryFeedback[] = [], template: string) {
    if (template === StatsIndividualViewComponent.VOLUNTARY_FEEDBACK_TEMPLATE) {
      return voluntaryFeedback;
    } else {
      return [];
    }
  }

  filterReviewFeedbackByDateRange(reviewFeedback: ReviewFeedback[] = [], dateRange: DateRangeFilter) {
    if (!dateRange.from || !dateRange.to) {
      return reviewFeedback;
    } else {
      return reviewFeedback.filter((feedback) =>
        moment(feedback.review.dueDate).isBetween(dateRange.from, dateRange.to)
      );
    }
  }

  filterVoluntaryFeedbackByDateRange(voluntaryFeedback: VoluntaryFeedback[] = [], dateRange: DateRangeFilter) {
    if (!dateRange.from || !dateRange.to) {
      return voluntaryFeedback;
    } else {
      return voluntaryFeedback.filter((feedback) =>
        moment(feedback.createdAt).isBetween(dateRange.from, dateRange.to)
      );
    }
  }

  openSnackBar(message: string) {
    this._snackBar.open(message, 'Dismiss', { duration: this.environmentService.getConfiguratonValues().SNACKBAR_DURATION });
  }

  onDateRangeStartChange($event: MatDatepickerInputEvent<Date>) {
    const from = $event.value;
    const to = this.dateRangeFilter$.getValue().to;
    this.updateDateRange(from, to)
  }

  onDateRangeEndChange($event: MatDatepickerInputEvent<Date>) {
    const from = this.dateRangeFilter$.getValue().from;
    const to = $event.value;
    this.updateDateRange(from, to);
  }

  private updateDateRange(from: Date, to: Date) {
    if (!!from && !!to && moment(from).diff(to) >= 0) {
      this.openSnackBar('Invalid date range period. Ensure end date is greater than start date.');
    } else {
      this.dateRangeFilter$.next({
        from,
        to
      });
    }
  }

  updateChosenTemplate(chosenTemplate: string) {
    this.chosenTemplateName$.next(chosenTemplate);
  }

  clearDateRange() {
    this.dateRangeFilter$.next({ from: undefined, to: undefined });
  }
}
