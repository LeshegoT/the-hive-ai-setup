import { Component, EventEmitter, OnInit, Output, Input, OnChanges } from '@angular/core';
import { ReportService } from '../../services/report.service';
import { map, startWith } from 'rxjs/operators';
import { FormsModule, ReactiveFormsModule, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs';
import { Person } from '../../shared/interfaces';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ManagerService } from '../../services/manager.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { EnvironmentService } from "../../services/environment.service";
import { isBBDEmail, includeInObjectWhenSet } from '@the-hive/lib-shared';

export type IconType = 'search' | 'add' ;
export type LabelType = 'Add Feedback Provider' | 'Employee' | 'Add Meeting Attendee' | 'Guide User Principle Name';

@Component({
    selector: 'app-staff-filter',
    templateUrl: './staff-filter.component.html',
    styleUrls: ['./staff-filter.component.css'],
    imports: [
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        MatIconModule,
        MatIconButton,
        AsyncPipe,
        CommonModule
    ]
})
export class StaffFilterComponent implements OnInit, OnChanges {
  @Input() searchLabel: LabelType;
  @Input() searchType: IconType;
  @Input() searchBy: 'manager' | 'staff';
  @Input() selectedUPN: string = undefined;
  @Input() blockBBDEmails = false;

  peopleData: Person[];
  filteredPeopleOptions: Observable<Person[]>;
  employeeSearchControl = new FormControl<string | Person>("");
  selectedUserPrinciple: Person;
  bbdDomains: string[] = []


  constructor(private reportService: ReportService, private managerService: ManagerService, private environmentService: EnvironmentService ) {}

  ngOnInit() {
    this.environmentService.getConfig().subscribe((configuration) => {
      this.bbdDomains = configuration.BBD_DOMAINS;
      this.employeeSearchControl = new FormControl<string | Person>("", {
        validators: [
          (control: AbstractControl<string> | AbstractControl<Person>): ValidationErrors => {
            const upn = typeof control.value === 'string' ? control.value : control.value.userPrincipleName;
            if (this.blockBBDEmails) {
              const isBBDEmailValidationError = isBBDEmail(upn, this.bbdDomains);
              const isEmailValidationError = Validators.email(control);
              return {
                ...(includeInObjectWhenSet('bbdEmail', isBBDEmailValidationError)),
                ...isEmailValidationError
              }
            } else {
              return null;
            }
          }, 
        ]
      })
    })

    this.getPeople();

    this.employeeSearchControl.valueChanges.subscribe((selectedPersonOrUpn) => {
      if (typeof selectedPersonOrUpn === "object" && selectedPersonOrUpn.userPrincipleName) {
        this.selectedUserPrinciple = selectedPersonOrUpn;
      } else if (typeof selectedPersonOrUpn === "string" && this.employeeSearchControl.valid) {
        const existingStaffMember = this._filter(selectedPersonOrUpn)[0];
        this.selectedUserPrinciple = existingStaffMember ?? {
          userPrincipleName: selectedPersonOrUpn,
          displayName: '',
          department: '',
          office: '',
          jobTitle: '',
          userName: '',
          manager: '',
          managerDisplayName: '',
          startDate: undefined,
          qualifications: undefined,
          entityAbbreviation: '',
          entityDescription: '',
          staffStatus: undefined
        };
      } else {
        this.selectedUserPrinciple = undefined;
      }
    })
  }

  ngOnChanges(): void {
    if (this.selectedUPN !== undefined) {
      const person = this._filter(this.selectedUPN).find((person) => person.userPrincipleName === this.selectedUPN);
      if(person){
        this.selectedUserPrinciple = person;
        this.selectStaff.emit();
        this.employeeSearchControl.setValue('');
      } else{
        this.employeeSearchControl.setValue(this.selectedUPN);
      }
    } else {
      // no upn was provided to select against a person
    }
  }

  clearField(event) {
    if (this.selectedUserPrinciple && this.employeeSearchControl.valid) {
      this.selectStaff.emit();
      if (event !== undefined && event.target !== undefined) event.target.blur();
    } else if (this.selectedUserPrinciple !== undefined) {
      this.selectedUserPrinciple = undefined;
    } else {
      //Do nothing if no user principle is selected to be cleared.
    }

    this.employeeSearchControl.setValue('');
  }

  onPersonSelected(event: MatAutocompleteSelectedEvent) {
    this.selectedUserPrinciple = event.option.value;
    this.selectStaff.emit();
    this.employeeSearchControl.setValue('');
  }

  getPeople() {
    if(this.searchBy === 'manager'){
        this.getManagers();
    } else {
        this.getStaffMembers();
    }
  }

  populateFilter() {
    this.filteredPeopleOptions = this.employeeSearchControl.valueChanges.pipe(
      startWith(''),
      map((value) => (typeof value === 'string' ? value : value.userPrincipleName)),
      map((userPrincipleName) => (userPrincipleName ? this._filter(userPrincipleName) : this.peopleData.slice()))
    );
  }

  displayOnlyUPN(person: Person | string): string {
    if(typeof person === 'string'){
      return person;
    } else if(person && person.userPrincipleName){
      return person.userPrincipleName;
    } else{
      return '';
    }
  }

  private _filter(upn: string): Person[] {
    const filterValue = upn.toLowerCase();

    return this.peopleData.filter((option) => option.userPrincipleName.toLowerCase().includes(filterValue) || option.displayName.toLowerCase().includes(filterValue) );
  }

  getStaffMembers() {
    if (this.peopleData && this.peopleData.length > 0) {
      this.populateFilter();
    } else {
    this.reportService.getAllStaffOnRecord(true).subscribe((people) => {
      this.peopleData = people;
       this.populateFilter();
      });
    }
  }

  getManagers() {
    this.managerService.getManagers().subscribe((people) => {
      this.peopleData = people;
      this.populateFilter();
    });
  }

  @Output() selectStaff: EventEmitter<Person> = new EventEmitter();
}
