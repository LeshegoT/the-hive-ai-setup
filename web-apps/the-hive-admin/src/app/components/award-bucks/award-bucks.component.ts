import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { RewardsService } from '../../services/rewards.service';
import { AuthService } from '../../services/auth.service';
import { Observable, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TableService } from '../../services/table.service';
import { ReportService } from '../../services/report.service';
import { duration } from 'moment';

@Component({
    selector: 'app-award-bucks',
    templateUrl: './award-bucks.component.html',
    styleUrls: ['./award-bucks.component.css'],
    standalone: false
})
export class AwardBucksComponent implements OnInit, AfterViewInit, OnDestroy {
  awardForm: UntypedFormGroup;
  creatingReason: boolean;
  reasons$: Observable<any>;
  adminUser: string;
  dataSubscription: Subscription = new Subscription();
  formattedStaffdata = new MatTableDataSource();
  selectedRowIndex = '';
  newReasonDescription = '';
  currentReason = '';

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) peopleSort: MatSort;

  allStaffColumns = ['userPrincipleName', 'displayName', 'department', 'options', 'reasons', 'newReasons', 'actions'];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private rewardService: RewardsService,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    public tableService: TableService,
    private reportService: ReportService
  ) {}
  CurrentSelection: RequestDetail = {
    name: '',
    amount: 0,
    reason: '',
  };

  ngOnInit() {
    this.reasons$ = this.rewardService.getRewardReasons();
    const adminSubscription = this.auth.getUserPrincipleName().subscribe((data) => (this.adminUser = data));
    this.dataSubscription.add(adminSubscription);
    this.getStaff();
  }

  ngAfterViewInit() {
    this.formattedStaffdata.paginator = this.paginator;
    this.formattedStaffdata.paginator.firstPage();
    this.formattedStaffdata.sort = this.peopleSort;
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  getStaff() {
    let allStaff;
    this.reportService.getAllStaffOnRecord().subscribe((data) => {
      allStaff = data.filter((_allStaff) => {
        if (_allStaff.staffStatus === 'active') {
          return _allStaff;
        }
      });
          allStaff = allStaff.map((Staff) => {
          const FormattedStaff: StaffDetail = {
            userPrincipleName: Staff.userPrincipleName,
            displayName: Staff.displayName,
            department: Staff.department,
          };
          return FormattedStaff;
        });
      this.formattedStaffdata.data = allStaff;
    });
  }

  highlight(row) {
    this.selectedRowIndex = row.displayName;
    this.newReasonDescription = '';
    if (this.currentReason === '') {
      this.creatingReason = false;
    }
  }

  checkActiveSelect(row) {
    if (this.selectedRowIndex === row.displayName) {
      return false;
    } else {
      return true;
    }
  }

  updateCurrentName(Name) {
    this.CurrentSelection.name = Name.userPrincipleName.toString();
  }

  updateCurrentAmount(Amount) {
    this.CurrentSelection.amount = Amount.value;
  }

  updateCurrentReason(Reason) {
    this.CurrentSelection.reason = Reason;
  }

  applyFilter(filterValue: string) {
    this.formattedStaffdata.filter = filterValue.trim().toLowerCase();
  }

  newReasonCheck(data) {
    if (this.checkActiveSelect(data) === false && this.creatingReason) {
      return true;
    } else {
      return false;
    }
  }

  onSubmit(): void {
    if (this.CurrentSelection.name === '' || this.CurrentSelection.amount === 0) {
      this.snackBar.open('Cannot submit incomplete data, please recheck the forums entered!', 'Okay');
      return;
    }
    let createSubscription;
    if (this.newReasonDescription) {
      if (this.newReasonDescription.length < 2) {
        this.snackBar.open('Please input a valid reason description', 'Okay');
        return;
      }
      createSubscription = this.rewardService
        .rewardBucksNewReason(
          this.CurrentSelection.name,
          this.CurrentSelection.amount,
          this.adminUser,
          this.newReasonDescription
        )
        .subscribe(() => {
          this.snackBar.open('Bucks awarded successfully', '', { duration: 2000 });
        });
    } else {
      createSubscription = this.rewardService
        .rewardBucks(
          this.CurrentSelection.name,
          this.CurrentSelection.amount,
          this.adminUser,
          this.CurrentSelection.reason
        )
        .subscribe(() => {
          this.snackBar.open('Bucks awarded successfully', '', { duration: 2000 });
        });
    }

    this.dataSubscription.add(createSubscription);
  }

  checkNewReason(e) {
    if (e.value === 'Create new reason') {
      return (this.creatingReason = true);
    }
    this.updateCurrentReason(e.value);
    return (this.creatingReason = false);
  }
}

export interface StaffDetail {
  userPrincipleName: string;
  displayName: string;
  department: string;
}

export interface RequestDetail {
  name: string;
  amount: number;
  reason: any;
}
