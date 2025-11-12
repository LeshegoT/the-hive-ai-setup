import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { GroupService } from '../../services/group.service';
import { TracksService } from '../../services/tracks.service';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';

@Component({
    selector: 'app-create-new-track',
    templateUrl: './create-new-track.component.html',
    styleUrls: ['./create-new-track.component.css'],
    standalone: false
})
export class CreateNewTrackComponent implements OnInit, OnDestroy {
  dataSubscription: Subscription = new Subscription();
  groups$: Observable<{groupName: string}[]>;
  trackForm: UntypedFormGroup;
  isHidden = true;
  isChecked= false;
  error = false;
  existingTypes = [];
  addedGroups = [];
  groupDataSource = new MatTableDataSource();
  displayedGroupColumns: string[] = ['name', 'action'];
  @Output() updateTrack: EventEmitter<void> = new EventEmitter();
  constructor(
    private formBuilder: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private trackService: TracksService,
    private authService: AuthService,
    private groupService: GroupService,
    public matcher: CreateContentErrorStateMatcher
  ) {
    this.trackForm = this.formBuilder.group({
      code: ['', Validators.compose([Validators.required, Validators.pattern(/^[a-z-]+$/), Validators.maxLength(50)])],
      name: ['', Validators.compose([Validators.required, Validators.maxLength(50)])],
      icon: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(50), //max length set to 50 to reinforce database constraint
        ]),
      ],
      restrictions: [''],
    });
  }
  ngOnInit() {
    const trackSubscription = this.trackService.getAllTracksWithCourses().subscribe((types) => {
      for (const type of types) {
        this.existingTypes.push(type.code);
      }
    });
    this.groups$ = this.groupService.getAllGroups();
    this.dataSubscription.add(trackSubscription);
  }
  toggle() {
    this.isHidden = !this.isHidden;
  }
  addGroup() {
    const group = this.trackForm.controls['restrictions'].value;

    if (!group) {
      this.snackBar.open('Please select a group to add', '', { duration: 1000 });
      return;
    }

    const foundPos = this.addedGroups.map((item) => item.groupName).indexOf(group.groupName);

    if (foundPos !== -1) {
      this.snackBar.open('Cannot add duplicate group', '', { duration: 1000 });
      return;
    }

    this.addedGroups.push(group);
    this.groupDataSource.data = this.addedGroups;
  }

  deleteGroup(groupName) {
    const removePos = this.addedGroups.map((item) => item.groupName).indexOf(groupName);

    if (removePos !== -1) {
      this.addedGroups.splice(removePos, 1);
    }

    this.groupDataSource.data = this.addedGroups;
  }

  createTrack() {
    if (!this.trackForm.valid) {
      this.error = true;
      return;
    }

    const track = this.trackForm.getRawValue();

    if (this.existingTypes.indexOf(track.code) !== -1) {
      this.snackBar.open('Duplicate codes are not permitted', '', { duration: 1000 });
      return;
    }
    track.restrictions = this.addedGroups;
    track.creator = this.authService.getUserPrincipleName();
    this.error = false;

    const createSubscription = this.trackService.createTrack(track).subscribe(() => {
      this.snackBar.open('Track created successfully', '', { duration: 2000 });
      this.trackForm.reset();
      this.updateTrack.emit();
      this.addedGroups = [];
        this.isHidden = !this.isHidden;
        this.trackForm.reset();
        this.isChecked = false;
    });
    this.dataSubscription.add(createSubscription);
   }
  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
