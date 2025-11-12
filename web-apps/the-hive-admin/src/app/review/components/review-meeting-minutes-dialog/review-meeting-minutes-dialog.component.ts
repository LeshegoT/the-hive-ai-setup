import { Component, Inject, Input, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { IconType, LabelType, StaffFilterComponent } from '../../../components/staff-filter/staff-filter.component';
import { FeedbackService } from '../../services/feedback.service';
import { ReviewMeetingMinutes, ReviewMeetingAttendee, ReviewStatus } from '../../../shared/interfaces';
import { debounceTime, map, Subscription } from 'rxjs';
import { FormControl, UntypedFormControl, Validators } from '@angular/forms';
import { ReviewListItem } from '../../review-shared-interfaces';
import { EnvironmentService } from '../../../services/environment.service';
import { AuthService } from '../../../services/auth.service';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';


@Component({
    selector: 'app-review-meeting-minutes-dialog',
    templateUrl: './review-meeting-minutes-dialog.component.html',
    styleUrls: ['./review-meeting-minutes-dialog.component.css', '../../../shared/shared.css'],
    standalone: false,
    providers: [provideMaterialDatePickerConfiguration()],
})
export class ReviewMeetingMinutesDialogComponent implements OnInit, OnDestroy {
  @ViewChild(StaffFilterComponent) staffFilterComponent: StaffFilterComponent;
  meetingMinutes: ReviewMeetingMinutes = {
    meetingTimeslot: new Date(),
    notes: '',
    reviewId: undefined,
    meetingAttendees: []
  };
  searchLabel: LabelType = 'Add Meeting Attendee';
  searchType: IconType = 'add';
  review: ReviewListItem;
  autosaveSubscription: Subscription;
  
  reviewMeetingAttendees: MatTableDataSource<ReviewMeetingAttendee> = new MatTableDataSource();
  displayColumns: Array<string> = ['attendee', 'remove'];

  formValidation: UntypedFormControl = new UntypedFormControl(undefined, Validators.required);
  notes = new FormControl<string>('');
  maximumReviewMinutesNoteCharacters: number;

  activeHrRep: string;
  reviewStatuses: ReviewStatus[];
    
  remainingMeetingNotesCharacters$ = this.notes.valueChanges.pipe(
    map(notes => `${this.maximumReviewMinutesNoteCharacters - notes.length} characters remaining.`)
  );

  get reviewMeetingScheduledStatusId() {
    return this.reviewStatuses.find((reviewStatus) => reviewStatus.description === 'Review Meeting Scheduled').statusId;
  }

  constructor(
    public feedbackService: FeedbackService,
    public dialogRef: MatDialogRef<ReviewMeetingMinutesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private environmentService: EnvironmentService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.maximumReviewMinutesNoteCharacters = this.environmentService.getConfiguratonValues().MAXIMUM_REVIEW_MINUTES_NOTE_CHARACTERS;
    this.review = this.data.review;
    this.reviewStatuses = this.data.reviewStatuses;
    this.retrieveMeetingMinutes();
    this.initialiseActiveHrRep();
    this.initialiseAutosave();
  }

  initialiseActiveHrRep() {
    this.authService.getUserPrincipleName().subscribe((userPrincipleName) => this.activeHrRep = userPrincipleName);
  }

  ngOnDestroy() {
    this.autosaveSubscription.unsubscribe();
  }

  retrieveMeetingMinutes() {
    this.feedbackService.getReviewMeetingMinutes(this.review.reviewId)
    .subscribe(
      (res) => {
        if (res) {
          this.setMeetingMinutes(res); 
        } else {
          this.snackBar.open('No review minutes entered for this review', 'Dismiss', { duration: 3000,
          });
        }
      },
      (error) => {
        this.snackBar.open(error, 'Dismiss', {
          duration: 3000
        });
      }
    );
  }

  setMeetingMinutes(reviewMeetingMinutes: ReviewMeetingMinutes) {
    const retrievedMeetingMinutes = reviewMeetingMinutes;
    this.meetingMinutes = retrievedMeetingMinutes;
    this.setMeetingAttendees(retrievedMeetingMinutes);
    this.notes.setValue(this.meetingMinutes.notes);
  }

  initialiseAutosave() {
    this.autosaveSubscription = this.notes.valueChanges.pipe(
      debounceTime(this.environmentService.getConfiguratonValues().FEEDBACK_FORM_DEBOUNCE_THRESHOLD_IN_MILLISECONDS)
    ).subscribe((notes) => {
      this.saveReviewMeetingMinutes(notes, false, false);
    });
  }

  setMeetingAttendees(retrievedMeetingMinutes: ReviewMeetingMinutes) {
    this.reviewMeetingAttendees.data = retrievedMeetingMinutes.meetingAttendees;
  }

  addReviewMeetingAttendee() {
    const meetingAttendee = { attendeeUPN: this.staffFilterComponent.selectedUserPrinciple.userPrincipleName };
    const attendeeExists = this.reviewMeetingAttendees.data.find((attendee) => attendee.attendeeUPN == meetingAttendee.attendeeUPN) !== undefined;

    if (!attendeeExists) {
      this.reviewMeetingAttendees.data.push(meetingAttendee);
      this.reviewMeetingAttendees._updateChangeSubscription();
    } else {
      this.snackBar.open('Attendee already added', 'Dismiss', {
        duration: 3000
      });
    }
  }

  removeAttendee(row: ReviewMeetingAttendee) {
    const indexToRemove = this.reviewMeetingAttendees.data.indexOf(row);
    this.reviewMeetingAttendees.data.splice(indexToRemove, 1);
    this.reviewMeetingAttendees._updateChangeSubscription();
  }

  addOrUpdateReviewMeetingMinutes(meetingMinutes: ReviewMeetingMinutes, closePopup: boolean, updateAndFinalise: boolean) {
    this.feedbackService.addOrUpdateReviewMeetingMinutes(meetingMinutes, updateAndFinalise).subscribe(
      (_res) => {
        this.snackBar.open('Meeting notes have been successfully saved.', 'Dismiss', {
          duration: 3000
        });
        if(closePopup) {
          this.dialogRef.close({ finaliseReviewMeetingMinutes: updateAndFinalise });
        } else {
          // Do not close popup because the user wants to continue editing.
        }
      },
      (error) => {
        this.snackBar.open(error, 'Dismiss', {
          duration: 3000
        });
      }
    );
  }

  saveReviewMeetingMinutes(notes: string, closePopup: boolean, finaliseReviewMeetingMinutes = false) { 
    if (this.formValidation.invalid) {
      //Form input is invalid don't save meeting minutes
    } else {
      this.meetingMinutes.reviewId = this.review.reviewId;
      this.meetingMinutes.meetingAttendees = this.reviewMeetingAttendees.data;

      this.addOrUpdateReviewMeetingMinutes({
        ...this.meetingMinutes,
        notes
      }, closePopup, finaliseReviewMeetingMinutes);
    }
  }

  getFormDateError(): string {
    let error = '';

    if (this.formValidation.hasError('matDatepickerParse')) {
      error = 'Please enter a valid date';
    } else if (this.formValidation.hasError('required')) {
      error = 'Please enter a date';
    }
    return error;
  }

  canAddOrUpdateMeetingMinutes(): boolean {
    return this.review.hrRep === this.activeHrRep && this.review.reviewStatusId === this.reviewMeetingScheduledStatusId;
  }
}
