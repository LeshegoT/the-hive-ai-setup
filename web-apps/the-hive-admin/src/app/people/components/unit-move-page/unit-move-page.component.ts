import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StaffFilterComponent } from '../../../components/staff-filter/staff-filter.component';
import { Person } from '../../../shared/interfaces';
import { UnitChangeFormComponent } from '../unit-change-form/unit-change-form.component';
import { StaffProfileComponent } from '../../../components/staff-profile/staff-profile.component';


@Component({
  selector: 'app-unit-move-page',
  templateUrl: './unit-move-page.component.html',
  styleUrls: ['../../../shared/shared.css','./unit-move-page.component.css'],
  imports: [
    CommonModule,
    StaffFilterComponent,
    UnitChangeFormComponent,
    StaffProfileComponent
  ]
})
export class UnitMovePageComponent {
  @ViewChild(StaffFilterComponent) staffFilterComponent: StaffFilterComponent;
  selectedStaffMember$ = new BehaviorSubject<Person>(undefined);

  constructor() { }

  onSelectStaff() {
    const selectedPerson = this.staffFilterComponent.selectedUserPrinciple;
    this.selectedStaffMember$.next(selectedPerson);
  }
}
