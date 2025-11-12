import { Component, input, model, OnInit, output, ViewChild, OnDestroy } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { FileService } from '../../../services/file.service';
import { ReportService } from '../../../services/report.service';
import { TableService } from '../../../services/table.service';
import { fileTypes } from '../../../shared/enums';
import { StaffAdditionalInfoComponent } from '../staff-additional-info/staff-additional-info.component';
import { People } from '../../../components/stats-line-graph/stats-line-graph.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FeedbackService } from '../../../review/services/feedback.service';
import { EnvironmentService } from '../../../services/environment.service';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type AllStaffComponentAction = 'unitCorrections';
export type AllStaffColumn = 'displayName' | 'jobTitle' | 'userPrincipleName' | 'userName' | 'department' | 'office' | 'manager' | 'actions';

@Component({
    selector: 'app-all-staff',
    templateUrl: './all-staff.component.html',
    styleUrls: ['./all-staff.component.css'],
    imports: [
      CommonModule,
      MatPaginatorModule,
      MatSortModule,
      MatTableModule,
      MatInput,
      MatButtonModule,
      StaffAdditionalInfoComponent,
      MatIconModule,
      MatTooltipModule,
      MatDatepickerModule,
      MatFormFieldModule,
      MatInputModule,
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
export class AllStaffComponent implements OnInit, OnDestroy {
  private dataSubscription: Subscription = new Subscription();

  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    if (this.peopleData) {
      this.peopleData.paginator = paginator;
    } else {
      // the data source has not been initialized yet, so we cannot set the paginator
    }
  }
  @ViewChild(MatSort) set reportSort(sort: MatSort) {
    if (this.peopleData) {
      this.peopleData.sort = sort;
    } else {
      // the data source has not been initialized yet, so we cannot set the sort
    }
  }
  peopleData: MatTableDataSource<People>;
  reportColumns = input<AllStaffColumn[]>([
    'displayName',
    'jobTitle',
    'userPrincipleName',
    'userName',
    'department',
    'office',
    'manager',
    'actions'
  ]);
  showExportButtons = input<boolean>(false);
  selectedStaffMember = output<People>();
  actions = model<AllStaffComponentAction[]>([])
  userHasAdditionalInfoRights: Observable<boolean>;

  constructor(
    private readonly reportService: ReportService,
    private readonly fileService: FileService,
    public tableService: TableService,
    private readonly authService: AuthService,
    private readonly feedbackService: FeedbackService,
    private readonly environmentService: EnvironmentService,
    private readonly snackBar: MatSnackBar
  ) {
  }
  
  ngOnInit() {
    this.getPeople();
    this.userHasAdditionalInfoRights = this.authService.loggedInUserHasAdditonalInfoRights();
  }



  getPeople() {
    const reportsSubscription = this.reportService
      .getAllStaffOnRecord(true)
      .subscribe((people) => {
        this.peopleData = new MatTableDataSource<People>(people);
        this.peopleData.paginator = this.paginator;
        this.peopleData.sort = this.reportSort;
      });

    this.dataSubscription.add(reportsSubscription);
  }

  copyEmails() {
    this.fileService.CopyUPNs(this.peopleData.filteredData);
  }

  exportEmailsToText() {
    const emails = this.getEmailsAsText(this.peopleData.filteredData);
    this.fileService.generateFile(emails, 'BBD Users', fileTypes.text);
  }

  getEmailsAsText(objArray) {
    const people = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let emailsText = '';
    people.forEach((person) => {
      emailsText += person.userPrincipleName + ',';
    });

    return emailsText;
  }

  exportEmailsToCSV() {
    this.fileService.generateCSVFile(this.reportColumns().slice(2, 3),this.peopleData.filteredData, 'BBD Users');
  }

  applyFilter(filterValue: string) {
    this.peopleData.filter = filterValue.trim().toLowerCase();
  }

  openUnitCorrectionForUpn(staffMember: People) {
    this.selectedStaffMember.emit(staffMember);
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
