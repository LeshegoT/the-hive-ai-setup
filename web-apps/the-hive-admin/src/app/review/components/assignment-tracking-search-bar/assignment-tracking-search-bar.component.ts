import { Component, OnInit, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from "@angular/core";
import { AssignmentTrackingFilterParameters, Person } from "../../../shared/interfaces";
import { StaffFilterComponent } from '../../../components/staff-filter/staff-filter.component';
import { StaffOverviewService } from "../../services/staff-overview.service";
import { EnvironmentService } from "../../../services/environment.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
    selector: 'app-assignment-tracking-search-bar',
    templateUrl: './assignment-tracking-search-bar.component.html',
    styleUrls: ['./assignment-tracking-search-bar.component.css', '../../styles/reviewShared.css'],
    standalone: false
})
  export class AssignmentTrackingSearchBarComponent implements OnInit {
    @Output() emitFilterParameters = new EventEmitter<AssignmentTrackingFilterParameters>();
    @ViewChild(StaffFilterComponent) staffFilterComponent;
    @ViewChild('managerFilterComponent') managerFilterComponent: StaffFilterComponent;
    managerDetails: Person;
    snackBarDuration: number;

    filterParameters: AssignmentTrackingFilterParameters = {}

    constructor(
      public staffOverviewService: StaffOverviewService,
      private snackBar: MatSnackBar,
      private environmentService: EnvironmentService
    ) {}

    ngOnInit() {
      this.snackBarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
    }

    staffSearch() {
      const selectedStaffMember: Person = this.staffFilterComponent.selectedUserPrinciple;
      this.filterParameters.searchText = selectedStaffMember.userPrincipleName;
      this.filterParameters.selectedStaffMember = selectedStaffMember;
      this.emitFilterParameters.emit(this.filterParameters);
    }

    managerSearch() {
      const selectedManager: Person = this.managerFilterComponent.selectedUserPrinciple;
      this.filterParameters.manager = selectedManager.userPrincipleName;
      this.emitFilterParameters.emit(this.filterParameters);
      this.getManagerDetails(this.filterParameters.manager);
    }

    clearStaffSearch() {
      this.filterParameters.searchText = undefined;
      this.filterParameters.selectedStaffMember = undefined;
      this.emitFilterParameters.emit(this.filterParameters);
    }

    clearManagerSearch() {
      this.filterParameters.manager = undefined;
      this.emitFilterParameters.emit(this.filterParameters);
      this.managerDetails = undefined;
    }

    getManagerDetails(manager: string) {
      this.staffOverviewService.getStaffOnRecord(manager).subscribe(
        (details) => {
          this.managerDetails = details;
        },
        (err) => {
          this.snackBar.open(err, 'Dismiss', { duration: this.snackBarDuration });
        }
      );
    }
  }