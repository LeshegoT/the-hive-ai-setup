import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, Input, OnInit, output, signal, WritableSignal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BehaviorSubject, combineLatest, debounceTime, filter, forkJoin, map, Observable, of, startWith, switchMap } from 'rxjs';
import { SelectCompanyEntities } from "../../../components/select-company-entity/select-company-entity.component";
import { CompanyEntity } from "../../../services/company-entities.service";
import { EnvironmentService } from '../../../services/environment.service';
import { HrReviewDashboardService, ReviewsDashboardGroupingCategories } from '../../services/hr-review-dashboard.service';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FeedbackService } from '../../services/feedback.service';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Config } from '../../../shared/config';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import moment from 'moment';
import { DashboardFilterParams, latenessCategories, LatenessCategory, PeriodLength, ReviewStatus, reviewStatuses } from '@the-hive/lib-reviews-shared';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';
import { ContractAndRecommendationStatus } from '../../../contracts/services/contracts.service';
import { ContractsDashboardService } from '../../../contracts/services/contracts-dashboard.service';
import { ReviewDashboardServiceToken } from '../../../shared/reviews-dashboard-service-token';
import { FeedbackAssignmentTemplate } from '../../../shared/interfaces';
export type DashboardFilterFormErrors = {
  asAtFieldError: WritableSignal<string>;
  periodFieldError: WritableSignal<string>;
  numberOfPeriodsFieldError: WritableSignal<string>;
};

type DashboardFilterFormRestrictions = {
  restrictedCheckbox?: AbstractControl;
}

export type DashboardFilter = DashboardFilterParams & {
  hrRepShown: boolean;
  templateNameShown: boolean;
  groupingOrder: ReviewsDashboardGroupingCategories[];
}

@Component({
    selector: "app-dashboard-filter",
    templateUrl: "./dashboard-filter.component.html",
    styleUrls: ["../../../../styles.css", "../../styles/reviewShared.css", "./dashboard-filter.component.css"],
    imports: [
        FormsModule,
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatButtonModule,
        ReactiveFormsModule,
        SelectCompanyEntities,
        MatCardModule,
        MatExpansionModule,
        MatIconModule,
        MatCheckboxModule,
        CdkDropList,
        CdkDrag,
        MatProgressSpinnerModule
    ],
    providers: [
        {
            provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
            useValue: {
                subscriptSizing: 'dynamic'
            }
        },
        provideMaterialDatePickerConfiguration(),
    ]
})
export class DashboardFilterComponent implements OnInit {
  @Input() statuses: ReviewStatus[] | ContractAndRecommendationStatus[];
  selectedEntities$: BehaviorSubject<CompanyEntity[]> = new BehaviorSubject<CompanyEntity[]>(undefined);
  config$: Observable<Config>;
  hrReps$: Observable<string[]>;
  feedbackAssignmentTemplates$: Observable<FeedbackAssignmentTemplate[]>;
  filterChange = output<DashboardFilter>();
  filterParams: DashboardFilter;
  searchDebounceTime: number;
  filterForm: FormGroup;
  minimumNumberOfPeriods: number;
  maximumNumberOfPeriods: number;
  minimumAsAtDate: Date;
  maximumAsAtDate: Date;
  defaultPeriodLength: PeriodLength;
  formErrorMessages: DashboardFilterFormErrors;
  formRestrictions: DashboardFilterFormRestrictions = {
    restrictedCheckbox: undefined
  };
  ageingCategories: LatenessCategory[] = Array.from(latenessCategories);
  hrReps: string[] = [];
  feedbackAssignmentTemplates: FeedbackAssignmentTemplate[] = [];
  supportedGroupingCategories: ReviewsDashboardGroupingCategories[];
  groupingCategoriesDisplayNames: Readonly<Partial<Record<ReviewsDashboardGroupingCategories, string>>> = {
    lateness: 'Lateness',
    status: 'Status',
    hrRep: 'HR Rep',
    templateName: 'Review type'
  };

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly environmentService: EnvironmentService,
    private feedbackService: FeedbackService,
    private changeDetectorReference: ChangeDetectorRef,
    @Inject(ReviewDashboardServiceToken)
    private dashboardService: HrReviewDashboardService | ContractsDashboardService,
  ) {
    this.config$ = this.environmentService.getConfig();
    this.hrReps$ = this.feedbackService.getPeopleOwningReviews();
    if (this.dashboardService.getSupportedGroupingCategories().includes('templateName')) {
      this.feedbackAssignmentTemplates$ = this.feedbackService.getFeedbackAssignmentTemplates();
    } else {
      this.feedbackAssignmentTemplates$ = of([]);
    }
  }

  ngOnInit() {
    forkJoin({
      config: this.config$,
      hrReps: this.hrReps$,
      feedbackAssignmentTemplates: this.feedbackAssignmentTemplates$
    }).pipe(
      switchMap(({config, hrReps, feedbackAssignmentTemplates}) => {
        this.hrReps = hrReps;
        this.feedbackAssignmentTemplates = feedbackAssignmentTemplates;
        this.supportedGroupingCategories = this.dashboardService.getSupportedGroupingCategories();
        this.initializeConfigurationProperties(config);
        this.initializeFilterParams();
        this.initializeFilterForm();
        this.initializeFormErrorMessages();

        return combineLatest({
          filterForm: this.filterForm.valueChanges.pipe(startWith(this.filterForm.value)),
          selectedEntities: this.selectedEntities$.pipe(startWith([]))
        }).pipe(
          debounceTime(this.searchDebounceTime),
          filter(() => this.filterForm.valid)
        );
      })
    ).subscribe(filterValues => {
      this.updateFormErrorMessages();
      this.updateFilterParams(filterValues);
      this.filterChange.emit(this.filterParams);
      this.changeDetectorReference.markForCheck();
    });
  }

  private initializeConfigurationProperties(configuration: Config) {
    this.searchDebounceTime = configuration.SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS;
    this.minimumNumberOfPeriods = configuration.HR_REVIEW_DASHBOARD_MINIMUM_PERIODS;
    this.maximumNumberOfPeriods = configuration.HR_REVIEW_DASHBOARD_MAXIMUM_PERIODS;
    this.defaultPeriodLength = configuration.HR_REVIEW_DASHBOARD_DEFAULT_PERIOD_LENGTH;
    this.minimumAsAtDate = configuration.REVIEW_SYSTEM_LAUNCH_DATE;
    this.maximumAsAtDate = moment().endOf('month').toDate();
  }

  private initializeFilterParams() {
    this.filterParams = {
      asAtEndOf: new Date(),
      periodLength: this.defaultPeriodLength,
      numberOfPeriods: this.minimumNumberOfPeriods,
      companyEntities: [],
      hrRepShown: false,
      templateNameShown: true,
      excludedHrReps: [],
      excludedStatuses: ["Archived", "Cancelled"],
      excludedLatenesses: [],
      excludedTemplateNames: this.feedbackAssignmentTemplates.filter(template => !template.manualFeedbackAssignment).map(template => template.templateName),
      groupingOrder: this.supportedGroupingCategories,
    };
  }

  private initializeFilterForm() {
    this.filterForm = this.formBuilder.group({
      asAtEndOf: new FormControl(this.filterParams.asAtEndOf, [Validators.required]),
      periodLength: new FormControl(this.filterParams.periodLength, [Validators.required]),
      numberOfPeriods: new FormControl(this.filterParams.numberOfPeriods, [
        Validators.required,
        Validators.min(this.minimumNumberOfPeriods),
        Validators.max(this.maximumNumberOfPeriods),
      ]),
      hrRepShown: new FormControl(this.filterParams.hrRepShown),
      templateNameShown: new FormControl(this.filterParams.templateNameShown),
      statusShown: new FormControl(true, { nonNullable: true }),
      latenessShown: new FormControl(true, { nonNullable: true }),
      includedHrReps: new FormControl(this.hrReps),
      includedStatuses: new FormControl(this.statuses.filter(reviewStatus => reviewStatus !== "Archived" && reviewStatus !== "Cancelled")),
      includedLatenesses: new FormControl(this.ageingCategories),
      includedTemplateNames: new FormControl(this.feedbackAssignmentTemplates.filter(template => template.manualFeedbackAssignment).map(template => template.templateName)),
      groupingOrder: new FormControl(this.supportedGroupingCategories),
    });

    this.filterChange.emit(this.filterParams);
  }

  private initializeFormErrorMessages() {
    this.formErrorMessages = {
      asAtFieldError: signal<string>(undefined),
      periodFieldError: signal<string>(undefined),
      numberOfPeriodsFieldError: signal<string>(undefined)
    };
  }

  private updateFilterParams(filterValues: any) {
    this.filterParams = {
      ...(filterValues.filterForm),
      asAtEndOf: new Date(filterValues.filterForm.asAtEndOf),
      periodLength: filterValues.filterForm.periodLength,
      numberOfPeriods: parseInt(filterValues.filterForm.numberOfPeriods),
      companyEntities: filterValues.selectedEntities,
      hrRepShown: this.filterForm.get('hrRepShown').getRawValue(),
      templateNameShown: this.filterForm.get('templateNameShown').getRawValue(),
      excludedHrReps: this.hrReps.filter(hrRep => !filterValues.filterForm.includedHrReps.includes(hrRep)),
      excludedLatenesses: this.ageingCategories.filter(category => !filterValues.filterForm.includedLatenesses.includes(category)),
      excludedStatuses: this.statuses.filter(status => !filterValues.filterForm.includedStatuses.includes(status)),
      excludedTemplateNames: this.feedbackAssignmentTemplates.map(template => template.templateName).filter(templateName => !filterValues.filterForm.includedTemplateNames.includes(templateName)),
      groupingOrder: this.filterForm.get('groupingOrder').getRawValue()
    };
  }

  updateFormErrorMessages() {
    if (this.filterForm.get('asAtEndOf').hasError('required')) {
      this.formErrorMessages.asAtFieldError.set('An As At date is required');
    } else {
      this.formErrorMessages.asAtFieldError.set(undefined);
    }

    if (this.filterForm.get('periodLength').hasError('required')) {
      this.formErrorMessages.periodFieldError.set('A period length is required');
    } else {
      this.formErrorMessages.periodFieldError.set(undefined);
    }

    if (this.filterForm.get('numberOfPeriods').hasError('required')) {
      this.formErrorMessages.numberOfPeriodsFieldError.set("A number of periods must be chosen");
    } else if (this.filterForm.get('numberOfPeriods').hasError('min')) {
      this.formErrorMessages.numberOfPeriodsFieldError.set(`The minimum number of periods is ${this.minimumNumberOfPeriods}`);
    } else if (this.filterForm.get('numberOfPeriods').hasError('max')) {
      this.formErrorMessages.numberOfPeriodsFieldError.set(`The maximum number of periods is ${this.maximumNumberOfPeriods}`);
    } else {
      this.formErrorMessages.numberOfPeriodsFieldError.set(undefined);
    }
  }

  orderGrouping(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.supportedGroupingCategories, event.previousIndex, event.currentIndex);
    this.filterForm.get('groupingOrder').setValue(this.supportedGroupingCategories, {emitEvent: true});
  }

}
