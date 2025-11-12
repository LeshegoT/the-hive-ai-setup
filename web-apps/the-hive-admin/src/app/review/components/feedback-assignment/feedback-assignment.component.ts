import { Component, OnInit, Output, EventEmitter, Input, SimpleChanges, ViewChild, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Assignment, Person } from '../../../shared/interfaces';
import { FeedbackService, Review } from '../../../review/services/feedback.service';
import { StaffFilterComponent } from '../../../components/staff-filter/staff-filter.component';
import { AuthService } from '../../../services/auth.service';
import {UntypedFormControl, Validators} from '@angular/forms';
import { StaffOverviewService } from '../../services/staff-overview.service';
import { map, of, switchMap } from 'rxjs';

export interface CurrentAssignments extends Assignment {
  nudged: boolean;
}

export const defaultNumberOfDaysDueIn = 14;
@Component({
    selector: 'app-feedback-assignment',
    templateUrl: './feedback-assignment.component.html',
    styleUrls: ['./feedback-assignment.component.css', '../../../shared/shared.css', '../../styles/reviewShared.css'],
    standalone: false
})
export class FeedbackAssignmentComponent implements OnInit, OnChanges {
  assignmentData?: MatTableDataSource<Assignment> = new MatTableDataSource<Assignment>();
  assignmentColumns = ['reviewer', 'deadline', 'status', 'prompt'];

  activeReviewee: Person;
  showComments = false;
  invalidMessages : string[] ;
  showStaffFilter : boolean;

  @Output() showSnackBar: EventEmitter<string> = new EventEmitter();
  @Output() toggleGenerateReportMode: EventEmitter<boolean> = new EventEmitter();
  @Input() review: Review;
  emailFormControls: UntypedFormControl[] = [];
  activeUPN: string;

  @ViewChild(StaffFilterComponent) staffFilterComponent;

  constructor(public staffOverviewService: StaffOverviewService, public feedbackService: FeedbackService, public dialog: MatDialog, private authService: AuthService) {
    this.fetchReviewComments = this.fetchReviewComments.bind(this);
    this.postReviewComment = this.postReviewComment.bind(this);
  }

  ngOnInit() {
    this.setActiveUPN();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.showComments = false;

    if (this.review ) {
      this.loadReviewPanelContent();
    }
  }

  loadReviewPanelContent() {
    this.staffOverviewService.getStaffOnRecord(this.review.reviewee).subscribe(
      (res) => {
        this.assignmentData = undefined;
        this.activeReviewee = res;
        this.feedbackService.getReviewFeedbackAssignments(this.review.reviewID).subscribe(
          (res) =>{
            this.assignmentData = new MatTableDataSource();
            this.assignmentData.data = res.map((assignment) => (
              {
                createdBy: assignment.createdBy,
                assignedBy: assignment.assignedBy,
                createdAt: assignment.createdAt,
                dueBy: assignment.dueBy,
                feedbackAssignmentId: assignment.feedbackAssignmentId,
                reviewer: assignment.reviewer,
                status: assignment.status,
                displayName: assignment.displayName,
                hrRep: assignment.hrRep,
                assignedByDisplayName: assignment.assignedByDisplayName,
                hrNudges: assignment.hrNudges,
                systemNudges: assignment.systemNudges
              })
            );
          this.emailFormControls = this.assignmentData.data.map(()=>new UntypedFormControl('', [Validators.email]));
            this.updateFormControlStatus();
          }
        );
      },
      (err) => {
        this.showSnackBar.emit(`Could not load Staff Member details for ${this.review.reviewee}`);
      }
    );
  }

  nudgeFeedback(selectedAssignment: CurrentAssignments, $event: MouseEvent) {
    const actionButton = $event.currentTarget as HTMLButtonElement;
    actionButton.disabled = true;
    this.feedbackService
    .getCurrentDayFeedbackAssignmentNudges(selectedAssignment.feedbackAssignmentId)
    .pipe(
      switchMap((nudges) => {
        if (nudges.length === 0) {
          return this.feedbackService.nudgeAssignedFeedback(selectedAssignment.feedbackAssignmentId).pipe(
            map(() => 'Email Reminder Sent')
          );
        } else {
          return of(`${selectedAssignment.displayName} has already been nudged for feedback today`);
        }
      })
    )
    .subscribe({
      next: (message) => {
        this.showSnackBar.emit(message);
      },
      error: (error) => {
        actionButton.disabled = false;
        this.showSnackBar.emit(error);
      }
    });
  }

  commentsShow() {
    this.showComments = true;
  }

  toggleComments(mode: boolean) {
    this.showComments = mode;
  }

  exportReport() {
    this.toggleGenerateReportMode.emit();
  }

  checkIfNudgeDisabled(selectedAssignment: CurrentAssignments){
    return selectedAssignment.nudged;
  }

  setActiveUPN() {
    this.authService.getUserPrincipleName().subscribe((activeUPN) => {
      this.activeUPN = activeUPN;
    });
  }



  canEditFeedbackAssignment() {
    return this.assignmentData.data.length === 0 || this.activeUPN === this.assignmentData.data[0]["createdBy"];
  }

  updateFormControlStatus(): void {
    const canEdit = this.canEditFeedbackAssignment();
    for (const control of this.emailFormControls) {
      if (canEdit) {
        control.enable();
      } else {
        control.disable();
      }
    }
  }

  fetchReviewComments() {
    return this.feedbackService.getReviewComments(this.review.reviewID);
  }

  postReviewComment(comment: string) {
    return this.feedbackService.addReviewComment(this.review.reviewID, { comment });
  }
}
