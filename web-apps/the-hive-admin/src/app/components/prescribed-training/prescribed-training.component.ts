import { CourseInterface } from './../table-course/table-course.component';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { PrescribedTrainingService } from '../../services/prescribed-training.service';
import { Subscription } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { TableService } from '../../services/table.service';
import { MatDialog } from '@angular/material/dialog';
import { PrescribedTrainingDialogComponent } from '../prescribed-training-dialog/prescribed-training-dialog.component';
import { isValidEmail } from '../../shared/email-validators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-prescribed-training',
    templateUrl: './prescribed-training.component.html',
    styleUrls: ['./prescribed-training.component.css'],
    standalone: false
})
export class PrescribedTrainingComponent implements OnInit, OnDestroy {
  courses: CourseInterface[];
  courseId: number;
  selectedCourse: CourseInterface;
  assignedUsers: User[];
  newUsers: string;
  dueDateInput: Date;
  notAssignedUsers: User[];
  dataSubscription: Subscription = new Subscription();
  mailingList = false;
  notAssignedTableData = new MatTableDataSource();
  assignedTableData = new MatTableDataSource();
  notAssignedColumns = ['UserName','action'];
  assignedColumns = ['assigned','dueDate', 'completed', 'action'];

  private unassingedUsersPaginator: MatPaginator;

  @ViewChild('assingedUsersPaginator', { read: MatPaginator }) assingedUsersPaginator: MatPaginator;
  @ViewChild('unassingedUsersPaginator')
  set matPaginator(paginator: MatPaginator) {
    this.unassingedUsersPaginator = paginator;
    this.setDataSourceAttributes();
  }



  constructor(private prescribedTrainingService: PrescribedTrainingService, public tableService: TableService, public dialog: MatDialog, private snackbar: MatSnackBar) {}

  ngOnInit() {
    const courseSubs = this.prescribedTrainingService.getAllCourses().subscribe((courses) => (this.courses = courses));

    this.dataSubscription.add(courseSubs);
    this.dueDateInput = new Date();
    this.dueDateInput.setDate(this.dueDateInput.getDate() + 7);
  }

  setDataSourceAttributes() {
    this.notAssignedTableData.paginator = this.unassingedUsersPaginator;
    this.assignedTableData.paginator = this.assingedUsersPaginator;
  }

  applyFilter(filterValue: string, type: string) {
    switch (type) {
      case 'Assigned':
        this.assignedTableData.filter = filterValue.trim().toLowerCase();
        break;
      case 'Unassigned':
        this.notAssignedTableData.filter = filterValue.trim().toLowerCase();
        break;
    }
  }

  getAssignedUsers() {
    this.assignedUsers = undefined;
    this.selectedCourse = this.courses.find((c) => c.courseId === this.courseId);
    const assignedUserSubscription = this.prescribedTrainingService.getUsersAssignedToCourse(this.courseId).subscribe((users) => {
      this.assignedUsers = users;
      this.assignedTableData.data = this.assignedUsers;
    });

    this.dataSubscription.add(assignedUserSubscription);
  }

  refreshData() {
    this.getAssignedUsers();
    this.getNotassignedUsers();
  }

  getNotassignedUsers() {
    this.notAssignedUsers = undefined;
    const notAssignedUserSubscription = this.prescribedTrainingService
      .getUsersNotAssignedToCourse(this.courseId)
      .subscribe((notAssignedUsers) => {
        this.notAssignedUsers = notAssignedUsers;
        this.notAssignedTableData.data = this.notAssignedUsers;
      });

    this.dataSubscription.add(notAssignedUserSubscription);
  }

  saveNewUsersViaTable(user: string){
    if(user) {
        const saveSubscription = this.prescribedTrainingService
          .saveNewUsers([user], this.courseId, this.adjustDueDateForTimeZone(new Date(this.dueDateInput)))
          .subscribe((users) => {
            this.assignedUsers = users;
            this.refreshData();
            this.snackbar.open(`Assigned course to ${user}.`, 'dismiss', {
              duration: 3000,
            });
          });
      this.dataSubscription.add(saveSubscription);
    } else {
      //Do nothing since there is no user to save
    }
  }

  saveNewUsers() {
    if (!this.newUsers) return;

    const usersArray = this.newUsers
      .split(',')
      .map((user) => user.trim())
      .filter((user) => isValidEmail(user));

    if (!usersArray.length) return;

    let saveSubscription;

    if (!this.mailingList) {
      saveSubscription = this.prescribedTrainingService
        .saveNewUsers(usersArray, this.courseId, this.adjustDueDateForTimeZone(new Date(this.dueDateInput)))
        .subscribe((users) => {
          this.assignedUsers = users;
          this.refreshData();
        });
    } else {
      const openDialog = this.dialog.open(PrescribedTrainingDialogComponent, {
        width: '60em',
        disableClose: true,
        data: {
          disableButton: true,
          heading: 'Busy assigning the course to multiple people...',
          message:
            `It may take a few minutes for your changes to occur. Please do NOT refresh or close this page. Please wait until you are notified that the changes are complete before clicking the Close button. Your patience is appreciated.`,
        },
      });
      saveSubscription = this.prescribedTrainingService
        .saveNewMailingListUsers(usersArray, this.courseId, this.adjustDueDateForTimeZone(new Date(this.dueDateInput)))
        .subscribe({
          next: (users) => {
            this.assignedUsers = users;
            this.refreshData();
            this.newUsers = undefined;
            openDialog.componentInstance.setProperties(
              'You may close this window now.',
              'All courses have been successfully assigned.',
              false
            );
          },
          error: (error) => {
            openDialog.componentInstance.setProperties(
              'Please use valid mailing alises.',
              error,
              false
            );
            this.snackbar.dismiss()
          },
        });
    }

    this.dataSubscription.add(saveSubscription);
  }

  adjustDueDateForTimeZone(dueDate: Date){
    dueDate.setHours(dueDate.getHours() + 3);
    return dueDate;
  }

  removePrescribedCourse(upn: string) {
    const removeSubscription = this.prescribedTrainingService
      .removePrescribedCourse(upn, this.courseId)
      .subscribe((users) => {
        this.assignedUsers = users;
        this.refreshData();
      });

    this.dataSubscription.add(removeSubscription);
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}

export interface User{
  courseId: number,
  dateCompleted : Date,
  dueDate :  Date,
  isStaff : boolean,
  userPrincipleName : string,
}