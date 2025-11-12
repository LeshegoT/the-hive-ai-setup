import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import {
  MatExpansionModule,
  MatExpansionPanel,
} from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TopLevelTag } from '@the-hive/lib-skills-shared';
import { StaffFilterComponent } from '../../../../components/staff-filter/staff-filter.component';
import { StaffProfileComponent } from '../../../../components/staff-profile/staff-profile.component';
import { EnvironmentService } from '../../../../services/environment.service';
import { Person } from '../../../../shared/interfaces';
import { SearchByStaffTabsComponent } from '../../search-by-staff-tabs/search-by-staff-tabs.component';
@Component({
    selector: 'app-search-by-person',
    templateUrl: './skills-search-by-person.component.html',
    styleUrls: ['./skills-search-by-person.component.css'],
    imports: [
        CommonModule,
        MatExpansionModule,
        MatExpansionPanel,
        MatCardModule,
        MatIcon,
        StaffFilterComponent,
        MatProgressSpinnerModule,
        MatButtonModule,
        StaffProfileComponent,
        MatChipsModule,
        SearchByStaffTabsComponent
    ]
})
export class SearchByPersonComponent implements OnInit {
  @Input() selectedUPN: string = undefined;
  @Output() goBack = new EventEmitter<string>();
  searchText = '';
  selectedPerson: Person = undefined;
  selectedPersonUPN: string = undefined;
  snackbarDuration: number = undefined;
  topLevelTags: TopLevelTag[] = undefined;
  @ViewChild(StaffFilterComponent) staffFilterComponent: StaffFilterComponent;

  constructor(
    private readonly environmentService: EnvironmentService
  ) {}

  async ngOnInit() {
    this.snackbarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
  }

  clearSearchResults() {
    this.selectedPerson = undefined;
    this.selectedPersonUPN = undefined;
  }

  selectStaff() {
    this.selectedPerson = this.staffFilterComponent.selectedUserPrinciple;
    this.selectedPersonUPN =
      this.staffFilterComponent.selectedUserPrinciple.userPrincipleName;
    this.staffFilterComponent.employeeSearchControl.setValue(
      this.selectedPerson
    );
  }
} 