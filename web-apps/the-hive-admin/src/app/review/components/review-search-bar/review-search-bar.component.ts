import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest } from 'rxjs';
import { debounceTime, filter, map, mergeMap, startWith, switchMap } from 'rxjs/operators';
import { FeedbackService } from '../../../review/services/feedback.service';
import { calculateEndOfDay } from '../../../shared/date-utils';
import { AuthService } from '../../../services/auth.service';
import { EnvironmentService } from '../../../services/environment.service';
import { UpcomingReviewsFilterParameters } from '../../upcoming-reviews-filter-parameters';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { CompanyEntity } from '../../../services/company-entities.service';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';

@Component({
    selector: 'app-review-search-bar',
    templateUrl: './review-search-bar.component.html',
    styleUrls: ['./review-search-bar.component.css', '../../styles/reviewShared.css'],
    standalone: false,
    providers: [provideMaterialDatePickerConfiguration()]
})
export class ReviewSearchBarComponent implements OnInit, OnDestroy {
  @Output() fetchReviews = new EventEmitter<any>();
  @Output() actionButton = new EventEmitter<any>();
  @Output() currentlySelectedHrRep = new EventEmitter<any>();
  @Input() actionButtonText: string;
  @Input() actionButtonHint: string;
  filterParameters: UpcomingReviewsFilterParameters = {};
  currentUserUpn: string;

  subscriptions: Subscription[] = [];
  filterForm = new FormGroup({
    searchTypes: new FormControl<typeof this.reviewTypes>([]),
    searchDate: new FormControl<Date>(this.getUpcomingDate()),
  });

  $searchText = new BehaviorSubject<string | undefined>(undefined);
  $hrRepSearchUpn = new BehaviorSubject<string | undefined>(undefined);
  $searchDate = new BehaviorSubject<Date | undefined>(this.getUpcomingDate());
  $selectedCompanyFilter = new BehaviorSubject<CompanyEntity[]>(undefined);

  $filterParameters: Observable<UpcomingReviewsFilterParameters> = combineLatest({
    searchText: this.$searchText.pipe(map((value:string) => (value && value.length >= 3 ? value : undefined))),
    date: this.filterForm.controls.searchDate.valueChanges.pipe(
      startWith(calculateEndOfDay(this.filterForm.controls.searchDate.value)),
      filter(() => this.filterForm.controls.searchDate.valid),
      map((dateValue) => calculateEndOfDay(dateValue))
    ),
    hrRep: this.$hrRepSearchUpn,
    selectedCompanyFilter: this.$selectedCompanyFilter.pipe(
      map(companyEntities => companyEntities?.map(entity => entity.companyEntityId))
    )
}).pipe(
    map((filters) => ({
      ...filters,
       selectedReviewTypeIds: this.filterForm.controls.searchTypes.value?.map(option => option.id) || [],
      date: filters.date?.toISOString(),
    }))
  );

  reviewTypes: { id: number; name: string, manualFeedbackAssignment: boolean }[] = [];
  peopleOwningReviews: string[] = [];

  constructor(public feedbackService: FeedbackService, 
              public authService: AuthService,
              public environmentService: EnvironmentService, 
              public dialog: MatDialog) {}

  ngOnInit() {
    this.subscriptions.push(
      this.environmentService.getConfig().pipe(
        switchMap((config) => {
          return this.$filterParameters.pipe(debounceTime(config.SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS));
        })
      ).subscribe(params => {
        this.filterParameters = params;
        this.fetchReviews.emit(this.filterParameters);
      })
    );

    this.retrievePeopleOwningReviews();
    this.retrieveReviewType();
    this.$hrRepSearchUpn.subscribe((hrRep) => this.currentlySelectedHrRep.emit(hrRep));
  }

  onReviewTypeSelectionComplete() {
      this.updateFiltersAndFetch();
  }

  private updateFiltersAndFetch() {      
      const currentFilters = {
          searchText: this.$searchText.value && this.$searchText.value.length >= 3 ? this.$searchText.value : undefined,
          selectedReviewTypeIds: this.filterForm.controls.searchTypes.value?.map(option => option.id) || [],
          date: this.filterForm.controls.searchDate.valid ? calculateEndOfDay(this.filterForm.controls.searchDate.value)?.toISOString() : undefined,
          hrRep: this.$hrRepSearchUpn.value,
          selectedCompanyFilter: this.$selectedCompanyFilter.value?.map(entity => entity.companyEntityId)
      };
      
      this.filterParameters = currentFilters;
      this.fetchReviews.emit(this.filterParameters);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  onNonDateValueChange(newValue: string|number, $subject: Subject<any>) {
    $subject.next(newValue);
  }

  change(newValue: Date, $subject: Subject<any>) {
    $subject.next(calculateEndOfDay(newValue));
  }

  actionButtonTask($event) {
    const assignButton = $event.target;
    this.actionButton.emit(assignButton);
  }

  reloadData() {
    this.fetchReviews.emit(this.filterParameters);
  }

  applyDefaultFilters(){
    const limitedReviewUsers = this.environmentService.getConfiguratonValues().LIMITED_REVIEW_USERS.map(user => user.toLowerCase());
    const isUnitMoveRep = limitedReviewUsers.includes(this.currentUserUpn.toLowerCase());
    const defaultSelected = isUnitMoveRep
          ? this.reviewTypes.filter(reviewType => reviewType.name === 'Unit Move')
          : this.reviewTypes.filter(reviewType => reviewType.manualFeedbackAssignment);
    this.filterForm.controls.searchTypes.setValue(defaultSelected);
  }

  retrieveReviewType() {
      this.feedbackService.getFeedbackAssignmentTemplates().subscribe((assignmentTemplates) => {
      this.reviewTypes = assignmentTemplates
        .map((assignmentTemplate) => ({
          id: assignmentTemplate.feedbackAssignmentTemplateId,
          name: assignmentTemplate.templateName,
          manualFeedbackAssignment: assignmentTemplate.manualFeedbackAssignment,
        }));
        this.applyDefaultFilters();
    });
  }

  retrievePeopleOwningReviews() {
    this.authService.getUserPrincipleName()
    .pipe(map(userUpn => {
      this.currentUserUpn = userUpn;
      }), 
      mergeMap(() => this.feedbackService.getPeopleOwningReviews()
    ))
    .subscribe(people => {
      const limitedReviewUsers = this.environmentService.getConfiguratonValues().LIMITED_REVIEW_USERS.map(user => user.toLowerCase());
      if (limitedReviewUsers.includes(this.currentUserUpn.toLowerCase())) {
        this.peopleOwningReviews = people.filter(person => limitedReviewUsers.includes(person));
      } else {
        this.peopleOwningReviews = people;
      }     
      this.$hrRepSearchUpn.next(this.currentUserUpn);
    })
  }

  getUpcomingDate() {
    const upcomingDate = new Date();
    upcomingDate.setMonth(new Date().getMonth() + 2);
    return upcomingDate;
  }

  removeSelectedReviewTypeOption(option: (typeof this.reviewTypes)[0]) {
    const selectedOptions = this.filterForm.controls.searchTypes.value.filter(selectedOption => selectedOption.id !== option.id);
    this.filterForm.controls.searchTypes.setValue(selectedOptions);
    this.updateFiltersAndFetch();
  }

  resetDateSelection() {
    this.filterForm.controls.searchDate.setValue(this.getUpcomingDate());
  }

  getFormErrors(formControl: AbstractControl): string | undefined {
    let error: string;

    if (formControl.hasError('matDatepickerParse')) {
      error = 'Invalid date format. Please enter it as DD/MM/YYYY.';
    } else {
      error = undefined;
    }
    return error;
  }

  onEntitySelection(entities: CompanyEntity[]) {
    this.$selectedCompanyFilter.next(entities);
  }

}