import { Component, effect, Inject, signal, SimpleChanges, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommentTypeName, ReviewComment, StaffComment, UpcomingReviewComment } from '../../../shared/interfaces';
import { FeedbackService } from '../../services/feedback.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, switchMap } from 'rxjs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { EnvironmentService } from '../../../services/environment.service';
import { Config } from '../../../shared/config'

type Tabs = 'Upcoming' | 'Review';

@Component({
    selector: 'app-general-comments-dialog',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatTabsModule,
        MatProgressSpinnerModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        MatExpansionModule,
        MatCardModule
    ],
    templateUrl: './hr-comments-dialog.component.html',
    styleUrl: './hr-comments-dialog.component.css'
})
export class HrCommentsDialogComponent implements OnInit {
  upcomingReviewComments: UpcomingReviewComment[] = undefined;
  staffComments: StaffComment[] = undefined;
  reviewComments: ReviewComment[] = undefined;
  activeTab = signal<Tabs>('Upcoming'); 
  newCommentControl = new FormControl('', [Validators.required]);
  staffLevelComment = signal<StaffComment>(undefined);
  staffLevelCommentControl = new FormControl('', [Validators.required]);
  config: Config

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      staffId: number;
      staffReviewId?: number;
      reviewId?: number;
      userPrincipleName: string;
      userDisplayName: string;
    },
    public dialogRef: MatDialogRef<HrCommentsDialogComponent>,
    private feedbackService: FeedbackService,
    private snackBar: MatSnackBar,
    private environmentServirce: EnvironmentService,
  ) {
    effect(() => {
      this.loadCommentsForTab(this.activeTab());
      this.newCommentControl.markAsUntouched();
      if(this.canAddComment()) {
        this.newCommentControl.enable();
      } else {
        this.newCommentControl.disable();
      }
    });
  }

  ngOnInit() {
    this.config = this.environmentServirce.getConfiguratonValues();
    this.dialogRef.disableClose = true;
    this.loadStaffLevelComment();
    this.loadCommentsForTab(this.activeTab());
  }

  close(){
    this.dialogRef.close();
  }

  handleCommentsForTab(activeTab: Tabs) {
    const newComment = this.newCommentControl.value;
    if (newComment && newComment.trim().length > 0) {
      this.postComment(newComment, activeTab).subscribe({
        next: () => {
          this.newCommentControl.reset(); 
          this.loadCommentsForTab(activeTab);
        },
        error: (error) => {
          this.snackBar.open(error, 'Dismiss', { duration: 3000 });
        },
      });
    }
    else {
      this.snackBar.open('Please type comment before submitting', 'Dismiss', { duration: 3000 });
    }
    
  }

  postComment(comment: string, activeTab: Tabs) {
    switch (activeTab) {
      case 'Upcoming':
        this.upcomingReviewComments = undefined;
        return this.feedbackService.addUpcomingReviewComment(this.data.staffReviewId, { comment });
      case 'Review':
        this.reviewComments = undefined;
        return this.feedbackService.addReviewComment(this.data.reviewId, { comment });
    }
  } 

  loadCommentsForTab(activeTab: Tabs) {
    let commentType : CommentTypeName;
    let data : Observable<HrCommentsDialogComponent[CommentTypeName]>;
    switch (activeTab) {
      case 'Upcoming': 
        commentType = "upcomingReviewComments";
        data = this.feedbackService.getAllStaffReviewComments(this.data.userPrincipleName)
        break;
      case 'Review': 
        commentType = "reviewComments";
        data = this.feedbackService.getAllReviewsComments(this.data.userPrincipleName);
        break;
    }
    this.setCommentsForTab(data, commentType); 
  }

  setCommentsForTab(commentsData: Observable<any>, commentType: CommentTypeName) {
    commentsData.subscribe(
      (comments) => {
        this[commentType] = comments;
      },
      (err) => {
        this[commentType] = [];
        this.snackBar.open(err, 'Dismiss', { duration: 3000 });
      }
    );
  }

  canAddComment() {
    return (
      (this.data.staffReviewId !== undefined && this.activeTab() === 'Upcoming') ||
      (this.data.reviewId !== undefined && this.activeTab() === 'Review')
    );    
  }

  loadStaffLevelComment() {
    const fetchNewestComment = true;
    this.feedbackService.getStaffMemberComments(this.data.staffId, fetchNewestComment).subscribe(
    {
      next: (staffcomment: StaffComment)=>{
        this.staffLevelComment.set(staffcomment);
      },
      error: (error)=> {
        this.snackBar.open(error, 'Dismiss', {duration: this.config.SNACKBAR_DURATION});
      }
    });
  }

  addStaffLevelComment() {
    this.staffLevelCommentControl.markAsTouched();
    if (this.staffLevelCommentControl.valid){
      this.feedbackService.addStaffMemberComment(this.data.staffId, { comment: this.staffLevelCommentControl.value }).subscribe({
          next: () => {
            this.loadStaffLevelComment();
            this.staffLevelCommentControl.reset();
          },
          error: (error)=> {
            this.snackBar.open(error, 'Dismiss', {duration: this.config.SNACKBAR_DURATION});
          }
      });
    }else {
      //Form is not valid, do not save the staff level comment.
    }
  }

  deleteStaffLevelComment() {
    this.feedbackService.deleteStaffMemberComment(this.staffLevelComment().reviewHrCommentsStaffId).pipe(
      switchMap(_ => this.feedbackService.getStaffMemberComments(this.data.staffId, true)),
    ).subscribe({
      next: (comment: StaffComment) =>  this.staffLevelComment.set(comment),
      error: (error) => {
        this.snackBar.open(error, 'Dismiss', { duration: this.config.SNACKBAR_DURATION });
      }
    })
  }
}
