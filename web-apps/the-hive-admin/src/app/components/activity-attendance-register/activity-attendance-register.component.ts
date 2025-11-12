import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { LevelUpService } from '../../services/level-up.service';
import { map, switchMap } from 'rxjs/operators';
import { FileService } from '../../services/file.service';
import { concat, Subscription } from 'rxjs';
import { IconType, LabelType, StaffFilterComponent } from '../staff-filter/staff-filter.component';
import { isValidEmail } from '../../shared/email-validators';

@Component({
    selector: 'app-activity-attendance-register',
    templateUrl: './activity-attendance-register.component.html',
    styleUrls: ['./activity-attendance-register.component.css'],
    standalone: false
})
export class ActivityAttendanceRegister implements OnInit, OnDestroy {
  private dataSubscription: Subscription = new Subscription();

  activityId: number;
  activityId$;
  activity$;
  activityFacilitators;
  activityAttendees$;
  userName: string;
  activityColumns = ['name', 'email', 'bbdnet', 'unit'];
  newAttendeesList = new Array<string>();

  @ViewChild(StaffFilterComponent) staffFilterComponent;
  searchLabel: LabelType = 'Employee';
  searchType: IconType = 'search';

  constructor(
    private route: ActivatedRoute,
    private levelUpService: LevelUpService,
    private fileService: FileService
  ) {}

  ngOnInit() {
    this.activityId$ = this.route.paramMap.pipe(map((params: ParamMap) => params.get('activityId')));

    const activitySubscription = this.activityId$.subscribe((id) => (this.activityId = id));
    this.dataSubscription.add(activitySubscription);

    this.activity$ = this.activityId$.pipe(switchMap((id) => this.levelUpService.getLevelUpActivity(id)));

    const facilitatorsSubscription = this.activity$.subscribe((activity) => {
      this.activityFacilitators = this.levelUpService.getLevelUpFacilitators(activity.levelUpId);
    });
    this.dataSubscription.add(facilitatorsSubscription);

    this.activityAttendees$ = this.activityId$.pipe(
      switchMap((id) => this.levelUpService.getLevelUpActivityAttendees(id))
    );
  }

  async downloadSheet() {
    const downloadSubscription = this.levelUpService
      .getLevelUpActivityAttendeesSheet(this.activityId)
      .subscribe((data) => {
        this.fileService.downloadFile(new Blob([data.csv]), data.fileName);
      });
    this.dataSubscription.add(downloadSubscription);
  }

  addAttendees() {
    if (!this.newAttendeesList) return;

    const attendeesArray = this.newAttendeesList
      .map((user) => user.trim())
      .filter((user) => isValidEmail(user));

    if (!attendeesArray.length) return;

    this.newAttendeesList = [];

    this.activityAttendees$ = null;
    this.activityAttendees$ = this.levelUpService.addAttendees(attendeesArray, this.activityId);
  }
  addEmployee() {
    if (!this.newAttendeesList.includes(this.userName)) {
      this.newAttendeesList.push(this.userName);
    }
  }

  removeEmployee(person: string) {
    const itemIndex = this.newAttendeesList.indexOf(person);
    this.newAttendeesList.splice(itemIndex, 1);
  }

  selectStaff() {
    this.userName = this.staffFilterComponent.selectedUserPrinciple.userPrincipleName ;
    this.addEmployee();
  }
  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
