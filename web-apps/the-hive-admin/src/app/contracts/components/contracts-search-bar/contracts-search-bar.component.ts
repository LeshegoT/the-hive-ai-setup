import { Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  filter,
  map,
  Observable,
  startWith,
  Subscription,
  switchMap,
} from 'rxjs';
import { MatLabel } from '@angular/material/form-field';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AsyncPipe } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { ContractsAndContractRecommendationsFilterParameters, ContractsService } from '../../services/contracts.service';
import { EnvironmentService } from '../../../services/environment.service';
import { AuthService } from '../../../services/auth.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { calculateEndOfDay } from '../../../shared/date-utils';
import { MatChipsModule } from '@angular/material/chips';
import { Config } from '../../../shared/config';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SharedModule } from '../../../shared.modules';
import { SelectCompanyEntities } from '../../../components/select-company-entity/select-company-entity.component'
import { CompanyEntity } from '../../../services/company-entities.service';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';

const MIN_SEARCH_TEXT_INPUT = 3;
const MONTHS_TO_ADD_FOR_INITIAL_CONTRACT_END_DATE = 2;

@Component({
    selector: 'app-contracts-search-bar',
    imports: [
        AsyncPipe,
        ReactiveFormsModule,
        MatInputModule,
        MatLabel,
        MatDatepicker,
        MatDatepickerToggle,
        MatIcon,
        MatDatepickerInput,
        MatSelectModule,
        MatIconButton,
        MatTooltipModule,
        MatChipsModule,
        MatCheckboxModule,
        SharedModule,
        SelectCompanyEntities
    ],
    templateUrl: './contracts-search-bar.component.html',
    styleUrls: ['./contracts-search-bar.component.css', '../../../review/styles/reviewShared.css'],
    providers: [provideMaterialDatePickerConfiguration()]
})
export class ContractsSearchBarComponent implements OnInit, OnDestroy {
  @Output() onFiltersChanged = new EventEmitter<ContractsAndContractRecommendationsFilterParameters>();
  @Output() onCreateAllButtonClicked = new EventEmitter();
  @Input() showCreateAllRecommendationsButton = false;
  jobTitleList: string[];
  hrRepsWithContractRecommendations$: Observable<string[]>
  config: Config;
  searchText$: Observable<string>;
  selectedJobtitles$: Observable<string[]>;
  selectedCompanyEntities$: Observable<number[]>;

  constructor(readonly contractsService: ContractsService, 
    readonly environmentService: EnvironmentService,
    private authService: AuthService) {}

  readonly searchFormGroup = new FormGroup<{
    searchText: FormControl<string | undefined>;
    hrRep: FormControl<string | undefined>;
    endDate: FormControl<Date | undefined>;
    jobTitles: FormControl<string[]>;
    companyEntities: FormControl<number[]>;
  }>({
    searchText: new FormControl(),
    hrRep: new FormControl(),
    endDate: new FormControl(this.initialContractEndDate),
    jobTitles: new FormControl(undefined),
    companyEntities: new FormControl(undefined)
  });

  readonly subscriptions = new Array<Subscription>();

  ngOnInit() {
    this.hrRepsWithContractRecommendations$ = this.contractsService.getHrRepsWithContractRecommendations();
    this.config = this.environmentService.getConfiguratonValues();
    this.searchText$ = this.searchFormGroup.controls.searchText.valueChanges.pipe(
      filter((value) => value?.length === 0 || value?.length >= MIN_SEARCH_TEXT_INPUT),
      debounceTime(this.config.SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS)
    );
    this.selectedJobtitles$ = this.searchFormGroup.controls.jobTitles.valueChanges.pipe(
      debounceTime(this.config.SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS)
    );
    this.selectedCompanyEntities$ = this.searchFormGroup.controls.companyEntities.valueChanges.pipe(
      debounceTime(this.config.SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS)
    );
    const hrRepControl = this.searchFormGroup.controls.hrRep;
    const contractEndDateControl = this.searchFormGroup.controls.endDate;
    this.retrieveJobTitles();
    const subscription = this.authService.getUserPrincipleName().pipe(
      switchMap((userPrincipleName) => {
        hrRepControl.setValue(userPrincipleName);
        return combineLatest(
          {
            searchText: this.searchText$.pipe(startWith(this.searchFormGroup.controls.searchText.value)),
            hrRep: hrRepControl.valueChanges.pipe(startWith(hrRepControl.value)),
            endDate: contractEndDateControl.valueChanges.pipe(
              startWith(contractEndDateControl.value),
              filter(() => contractEndDateControl.valid)
            ),
            jobTitlesText :this.selectedJobtitles$.pipe(startWith(this.searchFormGroup.controls.jobTitles.value)),
            companyEntitiesFilter: this.selectedCompanyEntities$.pipe(startWith(this.searchFormGroup.controls.companyEntities.value))
          }
        ).pipe(
          map((values) => {
            return {
              searchText: values.searchText,
              hrRep: values.hrRep,
              endDate: values.endDate ? calculateEndOfDay(values.endDate) : undefined,
              jobTitlesText: values.jobTitlesText?.length > 0 ? values.jobTitlesText: undefined,
              companyEntitiesFilter: values.companyEntitiesFilter
            } as ContractsAndContractRecommendationsFilterParameters;
          })
        )
      })
    )
      .subscribe(this.onFiltersChanged);
    this.subscriptions.push(subscription);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  get initialContractEndDate() {
    const upcomingDate = new Date();
    upcomingDate.setMonth(new Date().getMonth() + MONTHS_TO_ADD_FOR_INITIAL_CONTRACT_END_DATE);
    return upcomingDate;
  }

  resetSearchFilters() {
    this.searchFormGroup.controls.searchText.setValue('');
    this.searchFormGroup.controls.endDate.setValue(this.initialContractEndDate);
    this.searchFormGroup.controls.jobTitles.setValue([]);
  }

  retrieveJobTitles() {
    this.contractsService.getStaffJobTitles().subscribe((jobTitles: {jobTitle: string}[]) => {
      this.jobTitleList = jobTitles.map((jobTitle) => jobTitle.jobTitle);
    })
  }

  removeJobTitleFromList(jobTitle: string)  {
    const jobTitles = this.searchFormGroup.value.jobTitles.filter((title) => title != jobTitle);
    this.searchFormGroup.controls.jobTitles.setValue(jobTitles);
  }

  getFormErrors(formControl: AbstractControl): string | undefined {
    let error: string;
    if (formControl.hasError('matDatepickerParse')) {
      error = 'Invalid date';
    } else {
      error = undefined;
    }
    return error;
  }

  onEntitySelection(entities: CompanyEntity[]) {
    this.searchFormGroup.controls.companyEntities.setValue(entities.map(entity => entity.companyEntityId));
  }
}
