import { Component, OnInit, ViewChild } from "@angular/core";
import { FeedbackService, Review } from "../../../review/services/feedback.service";
import { FeedbackReviewComponent } from "../../components/feedback-review/feedback-review.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FeedbackAssignmentComponent } from "../../components/feedback-assignment/feedback-assignment.component";
import { AuthService } from "../../../services/auth.service";
import * as moment from "moment";
import { ReviewReportComponent } from "../../components/review-report/review-report.component";
import { DateRangeFilter } from "../../../shared/interfaces";
import { ReviewStatusService } from "../../services/review-status.service";
import { FormControl, FormGroup } from "@angular/forms";
import { FilterDropDownOptionsComponent } from "../../components/filter-drop-down-options/filter-drop-down-options.component";
import { combineLatest, debounceTime, map, startWith } from "rxjs";
import { ReviewFilterParameters } from "../../review-filter-parameters";
import { EnvironmentService } from "../../../services/environment.service";
import { Config } from "../../../shared/config";
import { provideMaterialDatePickerConfiguration } from "../../../pipes/date-format.pipe";
export type FilterType = "pending" | "completed" | "createdBy" | "archived";
export type DateType = "from" | "to";
export type reviewType = number | "all";
export type ReviewDropDownOptions = { id: number; description: string };

export interface ReviewFilter {
  completed: boolean;
  pending: boolean;
  archived: boolean;
}

@Component({
    selector: "app-reviews",
    templateUrl: "./reviews.tab.html",
    styleUrls: ["./reviews.tab.css"],
    standalone: false,
    providers: [provideMaterialDatePickerConfiguration()]
})
export class ReviewsComponent implements OnInit {
  @ViewChild(FeedbackReviewComponent) feedbackReviewComponent;
  @ViewChild(FeedbackAssignmentComponent) feedbackAssignmentComponent;
  @ViewChild(ReviewReportComponent) reviewReportComponent;
  @ViewChild(FilterDropDownOptionsComponent) filterDropDownOptionsComponent: FilterDropDownOptionsComponent;

  reviewData: Review[];
  activeReview: Review;
  reviewTypes: { id: number; name: string }[] = [];

  filterParameters: ReviewFilterParameters;
  filterValues: ReviewFilter;
  filterDateRangeValues: DateRangeFilter = { from: undefined, to: undefined };
  parameterQuery: string;

  activeUPN: string;
  createAssignmentMode = false;
  generateReportMode = false;
  invalidMessages: string[] = [];
  reviewStatuses: ReviewDropDownOptions[] = [];
  searchFilterParametersForm = new FormGroup({
    searchTextForm: new FormControl<string>(""),
    userReviewsOnlyCheckbox: new FormControl<boolean>(true),
    selectedReviewStatuses: new FormControl<ReviewDropDownOptions[]>([]),
    selectedReviewTypes: new FormControl<typeof this.reviewTypes>([]),
  });

  chipsToShow$ = combineLatest({
    selectedReviewStatuses: this.searchFilterParametersForm.controls.selectedReviewStatuses.valueChanges.pipe(
      startWith(this.searchFilterParametersForm.controls.selectedReviewStatuses.value),
      map((selectedReviewStatuses) =>
        selectedReviewStatuses.map((option) => ({
          option,
          optionsFormControl: this.searchFilterParametersForm.controls.selectedReviewStatuses,
        })),
      ),
    ),
    selectedReviewTypes: this.searchFilterParametersForm.controls.selectedReviewTypes.valueChanges.pipe(
      startWith(this.searchFilterParametersForm.controls.selectedReviewTypes.value),
      map((selectedReviewTypes) =>
        selectedReviewTypes.map((option) => ({
          option,
          optionsFormControl: this.searchFilterParametersForm.controls.selectedReviewTypes,
        })),
      ),
    ),
  }).pipe(map((chips) => [...chips.selectedReviewTypes, ...chips.selectedReviewStatuses]));

  environmentConfiguration: Config;

  constructor(
    private feedbackService: FeedbackService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    public reviewStatusService: ReviewStatusService,
    public environmentService: EnvironmentService,
  ) {
    this.filterValues = {
      completed: false,
      pending: false,
      archived: false,
    };
  }

  ngOnInit() {
    this.environmentConfiguration = this.environmentService.getConfiguratonValues();
    this.setActivePrinciple();
    this.retrieveReviewType();
    this.filterParameters = {
      statusId: undefined,
      createdBy: this.activeUPN,
      from: undefined,
      to: undefined,
      searchText: "",
      archived: undefined,
      selectedReviewTypeIds: undefined,
      selectedStatusIds: undefined,
    };
    this.retrieveReviewStatuses();

    this.searchFilterParametersForm.valueChanges
      .pipe(debounceTime(this.environmentConfiguration.SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS))
      .subscribe({
        next: (_) => this.updateFilterParameters(),
      });
  }

  setActivePrinciple() {
    this.authService.getUserPrincipleName().subscribe((activeUPN) => {
      this.activeUPN = activeUPN;
    });
  }

  retrieveReviewType() {
    this.feedbackService.getFeedbackAssignmentTemplates().subscribe((assignmentTemplates) => {
      this.reviewTypes = assignmentTemplates.map((assignmentTemplate) => ({
        id: assignmentTemplate.feedbackAssignmentTemplateId,
        name: assignmentTemplate.templateName,
      }));
    });
  }

  displayFeedbackAssignments(selectedReview: Review) {
    if (selectedReview !== undefined) {
      this.activeReview = selectedReview;
      this.activeReview.dueDate = this.activeReview.dueDate ? new Date(this.activeReview.dueDate) : undefined;
    } else {
      this.activeReview = undefined;
    }
  }

  showSnackBar(message: string) {
    this.snackBar.open(message, "Dismiss", { duration: 3000 });
  }

  filterDateRange(dateOption: DateType, selectedDate: Date) {
    this.filterDateRangeValues[dateOption] = selectedDate;

    if (this.filterDateRangeValues.from && !this.filterDateRangeValues.to) {
      this.filterDateRangeValues.to = moment(this.filterDateRangeValues.from).add(6, "M").toDate();
    } else if (this.filterDateRangeValues.to && !this.filterDateRangeValues.from) {
      this.filterDateRangeValues.from = moment(this.filterDateRangeValues.to).subtract(6, "M").toDate();
    }

    if (this.filterDateRangeValues.from && this.filterDateRangeValues.to) {
      if (moment(this.filterDateRangeValues.from).diff(this.filterDateRangeValues.to) < 0) {
        this.filterParameters.from = this.filterDateRangeValues.from;
        this.filterParameters.to = this.filterDateRangeValues.to;
        this.filterParameters = { ...this.filterParameters };
      } else {
        this.showSnackBar("Invalid date range period. Ensure end date is greater than start date.");
      }
    } else {
      if (this.filterParameters.from) this.filterParameters.from = undefined;
      if (this.filterParameters.to) this.filterParameters.to = undefined;
    }
  }

  clearDateRange() {
    this.filterParameters.from = undefined;
    this.filterParameters.to = undefined;
    this.filterDateRangeValues.from = undefined;
    this.filterDateRangeValues.to = undefined;

    this.filterParameters = { ...this.filterParameters };
  }

  toggleGenerateReportMode() {
    this.generateReportMode = !this.generateReportMode;
    this.filterParameters = { ...this.filterParameters };
  }

  retrieveReviewStatuses() {
    this.reviewStatusService.getReviewStatuses().subscribe((statuses) => {
      this.reviewStatuses = statuses.map(({ statusId, description }) => ({ id: statusId, description: description }));
    });
  }

  removeSelectedOption(option: ReviewDropDownOptions, optionsFormControl: FormControl<ReviewDropDownOptions[]>) {
    const selectedItems = optionsFormControl.value.filter((selectedItem) => selectedItem.id !== option.id);
    optionsFormControl.setValue(selectedItems);
    this.updateFilterParameters();
  }

  updateFilterParameters() {
    const searchText: string = this.searchFilterParametersForm.controls.searchTextForm.value;

    if (searchText.length >= 3) {
      this.filterParameters.searchText = searchText;
    } else {
      this.filterParameters.searchText = undefined;
    }

    if (this.searchFilterParametersForm.controls.userReviewsOnlyCheckbox.value) {
      this.filterParameters.createdBy = this.activeUPN;
    } else {
      this.filterParameters.createdBy = undefined;
    }

    this.filterParameters.selectedStatusIds = this.searchFilterParametersForm.controls.selectedReviewStatuses.value.map(
      (status) => status.id,
    );
    this.filterParameters.selectedReviewTypeIds =
      this.searchFilterParametersForm.controls.selectedReviewTypes.value.map((reviewType) => reviewType.id);
    this.filterParameters = { ...this.filterParameters };
  }
}
