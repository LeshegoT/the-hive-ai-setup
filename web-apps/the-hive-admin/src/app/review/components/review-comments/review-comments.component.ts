import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { FeedbackService } from '../../../review/services/feedback.service';
import { HrComment } from '../../../shared/interfaces';

@Component({
    selector: 'app-review-comments',
    templateUrl: './review-comments.component.html',
    styleUrls: ['./review-comments.component.css'],
    standalone: false
})
export class ReviewCommentsComponent implements OnChanges {
  @Input() showComments: boolean;
  @Input() fetchComments: () => Observable<HrComment[]>;
  @Input() postComment: (comment: string) => Observable<void>;
  @Output() toggleComments: EventEmitter<boolean> = new EventEmitter();

  newComment: string;
  activeReviewComments: HrComment[] = [];

  constructor(public feedbackService: FeedbackService, private snackBar: MatSnackBar) {}

  ngOnChanges(changes: SimpleChanges) {
    this.loadReviewComments();
  }

  addComment() {
    this.postComment(this.newComment).subscribe({
      next: () => {
        this.newComment = '';
        this.loadReviewComments();
      },

      error: (error) => {
        this.snackBar.open(error, 'Dismiss', { duration: 3000 });
      },
    });
  }

  handleAddComments() {
    if (this.newComment.trim().length > 0) {
      this.addComment();
    } else {
      this.snackBar.open('Please type a comment before submitting', 'Dismiss', { duration: 3000 });
    }
  }

  hideComments() {
    this.toggleComments.emit(false);
  }

  loadReviewComments(){
    if (this.showComments) {
      this.activeReviewComments = undefined;
      this.fetchComments().subscribe(
        (comments) => {
          this.activeReviewComments = comments;
        },
        (err)=>{
          this.activeReviewComments = [];
          this.snackBar.open(err, 'Dismiss', {duration: 3000});
        }
      );
    } else {
      // Do not load comments we will not show.
    }
  }
}
