import { Component, OnInit, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Observer, Subject, Subscription, combineLatest } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { Person, StaffOverviewFilterParameters } from "../../../shared/interfaces";
import {UntypedFormControl} from '@angular/forms';
import { UnitService } from "../../../services/unit.service";
import { StaffFilterComponent } from "../../../components/staff-filter/staff-filter.component";
import { CompanyEntity } from "../../../services/company-entities.service";

@Component({
    selector: 'app-staff-overview-search-bar',
    templateUrl: './staff-overview-search-bar.component.html',
    styleUrls: ['./staff-overview-search-bar.component.css', '../../styles/reviewShared.css'],
    standalone: false
})
  export class StaffOverviewSearchBarComponent implements OnInit, OnDestroy {
    constructor(public unitService: UnitService) {}
    @ViewChild(StaffFilterComponent, { static: true }) staffFilterComponent;
    @Output() emitFilterParameters = new EventEmitter<any>();

    filterParameters: StaffOverviewFilterParameters = {}
    isBoxChecked = false;
    subscriptions: Subscription[] = [];

    $searchText = new BehaviorSubject<string | undefined>(undefined);
    $staffTypeDropDown = new BehaviorSubject<string | undefined>(undefined);
    $unit = new BehaviorSubject<string | undefined>(undefined);
    $entityFilters = new BehaviorSubject<CompanyEntity[]>([]);
    allStaffUnits: string[] = [];
    filteredStaffUnits: Observable<string[]>;
    unitFormControl = new UntypedFormControl();
    selectedStaffMember: Person;

    $filterParameters: Observable<any> = combineLatest([
        this.$searchText.pipe(map((value:string) => (value && value.length >= 3 ? value : undefined))),
        this.$staffTypeDropDown,
        this.$unit.pipe(map((value: string) => (value && value.length ? value : undefined))),
        this.$entityFilters.pipe(map(value=>value.map(entity=>entity.companyEntityId)))
      ])
      .pipe(
        map(([searchText, staffTypeDropDown, unit, entityFilters]) => ({
          searchText: searchText,
          staffTypeDropDown: staffTypeDropDown,
          unit: unit,
          entityFilters
        }))
      );

    staffFilters: { value: string; description: string }[] = [
      { value: 'noReview', description: 'No review date scheduled' },
      { value: 'newStaff', description: 'New staff without 6 month reviews' },
      { value: 'currentStaff', description: 'Staff with no reviews in 12 months' }
    ]

    ngOnInit() {
        this.subscriptions.push(
            this.$filterParameters.subscribe((value) => {
              this.filterParameters.searchText = value.searchText;
              this.filterParameters.staffFilter = value.staffTypeDropDown;
              this.filterParameters.unit = value.unit;
              this.filterParameters.entityFilters = value.entityFilters
              this.emitFilterParameters.emit(this.filterParameters);
            })
          );
      this.retrieveAllStaffUnits();
      this.filteredStaffUnits = this.unitFormControl.valueChanges.pipe(
        startWith(''),
        map(value => this.filterUnits(value))
      );
    }

    ngOnDestroy() {
        this.subscriptions.forEach((s) => s.unsubscribe());
      }

    filterSearchText(){
      if (this.staffFilterComponent?.selectedUserPrinciple?.userPrincipleName !== undefined) {
        this.$searchText.next(this.staffFilterComponent.selectedUserPrinciple.userPrincipleName);
        this.selectedStaffMember = this.staffFilterComponent.selectedUserPrinciple;
      } else {
        //Do nothing is no userPrincipleName has been defined.
      }
    }

    onCompanyEntitySelected(event: CompanyEntity[]): void {
      this.$entityFilters.next(event)
    }

    clearFilterSearchText() {
      this.$searchText.next(undefined);
      this.selectedStaffMember = undefined;
      this.staffFilterComponent.clearField();
    }

    filterStaffUnit(newUnit: string) {
      this.$unit.next(newUnit);
    }

    staffTypeValueChange(value: string) {
      this.$staffTypeDropDown.next(value);
    }

    retrieveAllStaffUnits() {
      this.unitService.getAllUnits().subscribe(units => {
        this.allStaffUnits = units.map((unit)=> unit.unitName);
      })
    }

    private filterUnits(unit: string): string[] {
      if(unit.length === 0) {
        this.$unit.next(undefined);
        return [];
      } else {
        const inputUnit = unit.toLowerCase();
        return this.allStaffUnits.filter(option => option.toLowerCase().includes(inputUnit));
      }
    }
  }