/**@format */
import { CommonModule } from "@angular/common";
import { Component, OnInit, ViewChild, viewChild } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AttributeType, JsType, JSTypeScale, OnSupplyRole, SkillField, StaffOnSupply, UserAttribute } from "@the-hive/lib-skills-shared";
import { BehaviorSubject, debounceTime, map, catchError, Observable, of } from "rxjs";
import { LoadingIndicatorComponent } from "../../../components/loading-indicator/loading-indicator.component";
import { StaffFilterComponent } from "../../../components/staff-filter/staff-filter.component";
import { EnvironmentService } from "../../../services/environment.service";
import { TableService } from "../../../services/table.service";
import { Person } from "../../../shared/interfaces";
import { SupplyService } from "../../services/supply.service";
import { SkillsService } from "../../../skills/services/skills.service";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { UserAttributeCardComponent } from "../user-attribute-card/user-attribute-card.component";
import { provideMaterialDatePickerConfiguration } from "../../../pipes/date-format.pipe";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionSelectionChange } from "@angular/material/core";

export type StaffOnSupplyWithRoleFormControl = Omit<StaffOnSupply, 'role'> & {role: FormControl<string>};
@Component({
  selector: "app-staff-on-supply",
  templateUrl: "./staff-on-supply.component.html",
  styleUrls: ["./staff-on-supply.component.css", "../../../shared/shared.css"],
  providers: [provideMaterialDatePickerConfiguration()],
  standalone: true,
  imports: [
    MatTableModule,
    CommonModule,
    LoadingIndicatorComponent,
    MatPaginatorModule,
    MatSortModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    StaffFilterComponent,
    MatIcon,
    MatTooltipModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    UserAttributeCardComponent,
  ],
})
export class StaffOnSupplyView implements OnInit {
  columns: (keyof StaffOnSupplyWithRoleFormControl | string)[] = [
    "displayName",
    "upn",
    "jobTitle",
    "department",
    "manager",
    "role",
    "entity",
    "onSupplyAsOf",
    "coreTech",
    "actions"
  ];
  staffOnSupplyTable$ = new Observable<MatTableDataSource<StaffOnSupplyWithRoleFormControl>>;
  paginator = viewChild.required<MatPaginator>("paginator");
  sortColumn = "";
  sortDirection = "";
  displayNameSearch = "";
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(StaffFilterComponent) staffFilterComponent;
  staffToAdd$ = new BehaviorSubject<Person>(undefined);
  snackBarDuration: number;
  debounceTime: number;
  allowedCoreAttributeTypes: AttributeType[];
  maximumCoreAttributesForUser: number = undefined;
  earliestAllowedStaffOnSupplyAsOfDate: Date = undefined;
  userAttributes$: BehaviorSubject<UserAttribute[]> = new BehaviorSubject(undefined);
  jsTypes: JsType[] = undefined;
  jsTypeScales: JSTypeScale[] = undefined;
  skillsFields: SkillField[] = undefined;
  expandedRow: StaffOnSupplyWithRoleFormControl = undefined;
  mapStaffOnSupplyFields: (staffOnSupply: StaffOnSupplyWithRoleFormControl[]) => StaffOnSupplyWithRoleFormControl[] = (staffOnSupply) => staffOnSupply;
  staffOnSupply$: BehaviorSubject<StaffOnSupplyWithRoleFormControl[]> = new BehaviorSubject(undefined);
  onSupplyRoles$: Observable<OnSupplyRole[]>;

  constructor(
    private supplyService: SupplyService,
    public tableService: TableService,
    private readonly matSnackBar: MatSnackBar,
    private readonly environmentService: EnvironmentService,
    private skillsService: SkillsService
  ) {
    this.snackBarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
    this.debounceTime = this.environmentService.getConfiguratonValues().SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS;
    this.allowedCoreAttributeTypes = this.environmentService.getConfiguratonValues().ALLOWED_CORE_ATTRIBUTE_TYPES;
    this.maximumCoreAttributesForUser = this.environmentService.getConfiguratonValues().MAXIMUM_CORE_ATTRIBUTES_FOR_USER;
    this.earliestAllowedStaffOnSupplyAsOfDate = new Date(this.environmentService.getConfiguratonValues().EARLIEST_ALLOWED_STAFF_ON_SUPPLY_AS_OF_DATE);
  }

  async ngOnInit() {
    this.onSupplyRoles$ = this.supplyService.getOnSupplyRoles();
    this.skillsFields = await this.skillsService.getSkillsFields();
    this.jsTypes = await this.skillsService.getJSTypes();
    this.jsTypeScales = await this.skillsService.getJSTypeScale();
    this.supplyService.getStaffOnSupply().subscribe((staffOnSupply) => this.staffOnSupply$.next(staffOnSupply.map((staff: StaffOnSupply) => ({
        ...staff,
        role: new FormControl(staff.role),
    }))));

    this.staffOnSupplyTable$ = this.staffOnSupply$.pipe(
      map((staffOnSupply) => {
        if(staffOnSupply){
          const datasource = new MatTableDataSource(this.mapStaffOnSupplyFields(staffOnSupply));
          datasource.sort = this.sort;
          return datasource;
        } else{
          return undefined;
        }
      })
    )
  }

  addStaffToSupply(staffOnSupply: StaffOnSupplyWithRoleFormControl[]) {
    const personToAdd = {
      ...this.staffFilterComponent.selectedUserPrinciple,
      upn: this.staffFilterComponent.selectedUserPrinciple.userPrincipleName,
      onSupplyAsOf: new Date(),
      role: new FormControl(this.staffFilterComponent.role),
    };

    if (staffOnSupply.find((staffOnSupply) => staffOnSupply.upn === personToAdd.upn)) {
      this.matSnackBar.open("User already on supply", "Dismiss", {
        duration: this.snackBarDuration,
      });
    } else {
      this.supplyService
        .addStaffToSupply(personToAdd.upn, personToAdd.onSupplyAsOf)
        .pipe(debounceTime(500))
        .subscribe({
          next: (coreTech) => {
            this.mapStaffOnSupplyFields = (staffOnSupply) => [...staffOnSupply, {...personToAdd, staffCoreTech: coreTech}];
            this.staffOnSupply$.next(staffOnSupply);
          },
          error: () => {
            this.matSnackBar.open("Failed to add user to supply", "Dismiss", {
              duration: this.snackBarDuration,
            });
          },
        });
    }
  }

  removeStaffFromSupply(staffOnSupply: StaffOnSupplyWithRoleFormControl[], userPrincipleName: string) {
    this.supplyService
      .removeStaffFromSupply(userPrincipleName)
      .pipe(debounceTime(500))
      .subscribe({
        next: () => {
          this.mapStaffOnSupplyFields = (staffOnSupply) => staffOnSupply.filter((staffOnSupply) => staffOnSupply.upn !== userPrincipleName);
          this.staffOnSupply$.next(staffOnSupply);
        },
        error: () => {
          this.matSnackBar.open("Failed to remove user from supply", "Dismiss", {
            duration: this.snackBarDuration,
          });
        },
      });
  }

  updateStaffOnSupply(event, staff: StaffOnSupplyWithRoleFormControl) {
    if (event._d && event._d > this.earliestAllowedStaffOnSupplyAsOfDate) {
      const updatedStaff: StaffOnSupply = {
        ...staff,
        role: staff.role.value,
        onSupplyAsOf: event._d,
      };
      this.supplyService
        .updateOnSupplyAsOf(updatedStaff)
        .pipe(debounceTime(500))
        .subscribe({
          next: () => {
            this.matSnackBar.open("Successfully updated date", "Dismiss", {
              duration: this.snackBarDuration,
            });
          },
          error: () => {
            this.matSnackBar.open("Failed to update date", "Dismiss", {
              duration: this.snackBarDuration,
            });
          },
        });
    } else {
      // Do nothing since the date is not valid
    }
  }

  isAttributeCoreTech(userAttribute: UserAttribute): boolean{
    return userAttribute.fieldValues.some((fieldValue) =>
      fieldValue.standardizedName === "coreTechAddedBy" || fieldValue.standardizedName === "coreTechAddedOn")
  }

  hasStaffReachedCoreTechLimit(staffCoreTech: UserAttribute[]): boolean{
    return staffCoreTech.length === this.maximumCoreAttributesForUser;
  }
  
  updateStaffCoreTech(
    staffOnSupply: StaffOnSupplyWithRoleFormControl[],
    selectedStaffUpn: string,
    staffCoreTechTransformer: (coreTech: UserAttribute[]) => UserAttribute[]
  ) {
    this.mapStaffOnSupplyFields = (staffOnSupply) =>
      staffOnSupply.map(staffOnSupply => {
        if (staffOnSupply.upn === selectedStaffUpn) {
          staffOnSupply.staffCoreTech = staffCoreTechTransformer(staffOnSupply.staffCoreTech);
        } else{
          // Do not modify other staffs core tech because this staffs upn does not match
          // the currently selected staff or rather the staff who's core tech we are modifying
        }
        return staffOnSupply;
    });

    this.staffOnSupply$.next(staffOnSupply);
  }

  makeCoreTech(userAttribute: UserAttribute, staffOnSupply: StaffOnSupplyWithRoleFormControl[], userAttributes: UserAttribute[], selectedStaffUpn: string){
    this.skillsService.addCoreTech(selectedStaffUpn, userAttribute)
      .pipe(
        catchError((error) => {
          this.matSnackBar.open(error, "Dismiss", {
            duration: this.snackBarDuration,
          });
          return of(undefined);
        }),
        map(coreTech => {
            if(coreTech){
              this.updateStaffCoreTech(staffOnSupply, selectedStaffUpn, (staffCoreTech) => [...staffCoreTech, coreTech]);
              return userAttributes.map((userAttribute) => 
                userAttribute.guid === coreTech.guid ? coreTech : userAttribute);
            } else{
              return userAttributes;
            }
          }
        )
      ).subscribe((updatedUserAttributes) => this.userAttributes$.next(updatedUserAttributes));
  }

  removeCoreTech(coreTechToRemove: UserAttribute, staffOnSupply: StaffOnSupplyWithRoleFormControl[], userAttributes: UserAttribute[], selectedStaffUpn: string){
    this.skillsService.removeCoreTech(selectedStaffUpn, coreTechToRemove)
      .pipe(
        catchError((error) => {
          this.matSnackBar.open(error, "Dismiss", {
            duration: this.snackBarDuration,
          });
          return of(undefined);
        }),
        map(userAttributeWithoutCoreTechInformation => {
            if(userAttributeWithoutCoreTechInformation){
              this.updateStaffCoreTech(staffOnSupply, selectedStaffUpn, (staffCoreTech) => 
                staffCoreTech.filter((coreTech) => coreTech.guid !== userAttributeWithoutCoreTechInformation.guid));
              return userAttributes.map((userAttribute) => 
                userAttribute.guid === userAttributeWithoutCoreTechInformation.guid ? userAttributeWithoutCoreTechInformation : userAttribute);
            } else{
              return userAttributes;
            }
          }
        )
      ).subscribe((updatedUserAttributes) => this.userAttributes$.next(updatedUserAttributes));
  }

  isRowExpanded(row: StaffOnSupplyWithRoleFormControl): boolean {
    return this.expandedRow === row;
  }

  toggleRowExpansionState(row: StaffOnSupplyWithRoleFormControl) {
    if(this.isRowExpanded(row)){
      this.expandedRow = undefined;
    } else{
      this.expandedRow = row;
      this.userAttributes$.next(undefined);
      this.getUserAttributes(row.upn);
    }
  }

  getUserAttributes(selectedStaffUpn: string){
    this.skillsService.getUserAttributes(selectedStaffUpn)
    .pipe(
      catchError(() => {
        this.matSnackBar.open(`Failed to retrieve ${selectedStaffUpn} skills, qualifications, certifications, industry knowledge and/or qualities`, "Dismiss", {
          duration: this.snackBarDuration,
        });
        return of(undefined);
      }),
      map(userAttributes => 
        userAttributes.filter((userAttribute) => 
          this.allowedCoreAttributeTypes.some((attributeType) => attributeType === userAttribute.attribute.attributeType)
        )
      )
    ).subscribe((filteredUserAttributes) => this.userAttributes$.next(filteredUserAttributes));
  }

  resetStaffRoleErrors(upn: string, roleUpdateError?: string, previousStaffRole?: string) {
    this.staffOnSupply$.value.forEach(staff => {
      if (staff.upn === upn && roleUpdateError) {
        staff.role.setValue(previousStaffRole);
        staff.role.setErrors({ roleUpdateError });
      } else {
        staff.role.setErrors(undefined);
      }
    });
  }

  async updateOnSupplyRole(event: MatOptionSelectionChange, staffRole: string,  onSupplyRoles: OnSupplyRole[], upn: string){
    if (event.isUserInput) {
      const matchingRole = onSupplyRoles.find(onSupplyRole => onSupplyRole.role === event.source.value);
      this.supplyService.updateStaffOnSupplyRole(upn, matchingRole).subscribe({
        next: () => {
          this.resetStaffRoleErrors(upn);
        },
        error: (roleUpdateError) => {
          this.resetStaffRoleErrors(upn, roleUpdateError, staffRole);
        }
      });
    } else {
      // If the event is not triggered by user input, no need to update the role
    }
  }
}
