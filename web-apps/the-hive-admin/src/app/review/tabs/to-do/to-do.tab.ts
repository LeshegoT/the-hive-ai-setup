import { Component, OnInit, ViewChild } from '@angular/core';
import { ReviewStatusService } from '../../../review/services/review-status.service';
import { ReviewToBeCreatedComponent } from '../../review-status-views/review-to-be-created/review-to-be-created.view';
import { ReviewSearchBarComponent } from '../../components/review-search-bar/review-search-bar.component';
import { AuthService } from '../../../services/auth.service';
import { StatusReviewsCounts } from '../../../shared/types';
import { FeedbackService } from '../../services/feedback.service';
import { UpcomingReviewsFilterParameters } from '../../upcoming-reviews-filter-parameters';
import { ReviewListStateNotifierService } from '../../services/review-list-state-notifier.service';
import { BehaviorSubject, Observable, startWith, switchMap } from 'rxjs';

@Component({
    selector: 'app-review-to-do',
    templateUrl: './to-do.tab.html',
    styleUrls: ['./to-do.tab.css', '../../styles/reviewShared.css'],
    standalone: false
})
export class ReviewToDOComponent implements OnInit {
  reviewStatusLabels: string[] = [
    'Upcoming Reviews',
    'New',
    'Feedback Providers Requested',
    'Feedback Providers Assigned',
    'Feedback in Progress',
    'Feedback Completed',
    'Report Downloaded',
    'Summary sent to STRATCO',
    'STRATCO Feedback Received',
    'Review Meeting Scheduled',
    'Finalise Salary',
    'Confirm Next Review Date',
  ];
  statusReviewsCounts$ = new Observable<StatusReviewsCounts>(undefined);
  currentActiveSectionIndex = 0;
  filterParameters: UpcomingReviewsFilterParameters = {};
  createReviewsButtonHint: string;
  createReviewsButtonText: string;
  @ViewChild(ReviewToBeCreatedComponent) reviewCreationComponent: ReviewToBeCreatedComponent;
  @ViewChild(ReviewSearchBarComponent) searchBar: ReviewSearchBarComponent;
  activeUPN: string;
  buttonsEnabled = true;

  constructor(
    private authService: AuthService,
    public reviewStatusService: ReviewStatusService,
    public feedBackService: FeedbackService,
    public reviewListStateNotifier: ReviewListStateNotifierService
  ) {}

  ngOnInit() {
    this.activateItem(0);
    this.setActiveUPN();
    this.statusReviewsCounts$ = this.reviewListStateNotifier.onReviewListStateChange().pipe(
      switchMap(() => this.feedBackService.getNumberOfReviewsBasedOnFilter(this.filterParameters).pipe(startWith(undefined)))
    );
  }

  setActiveUPN() {
    this.authService.getUserPrincipleName().subscribe((activeUPN) => {
      this.activeUPN = activeUPN;
    });
  }

  reloadData() {
    this.searchBar.reloadData();
  }

  openHRRepDialog(assignButton){
    this.reviewCreationComponent.openHRRepDialog(assignButton);
  }

  activateItem(itemIndex: number) {
    this.reviewListStateNotifier.notifyReviewListStateChange();
    this.currentActiveSectionIndex = itemIndex;
    if(itemIndex === 0){
      this.createReviewsButtonHint = 'Create all reviews with randomized HR Representative';
      this.createReviewsButtonText = 'Create All'; 
    }else{
      this.createReviewsButtonHint = '';
      this.createReviewsButtonText = '';
    }
  }

  updateReviewData(filterParameters: UpcomingReviewsFilterParameters) {
    this.filterParameters = JSON.parse(JSON.stringify(filterParameters));
    this.reviewListStateNotifier.notifyReviewListStateChange();
  }

  currentHrRep(hrRep: string | undefined){
    if (hrRep && hrRep.toLowerCase() === this.activeUPN.toLowerCase()) {
      this.buttonsEnabled = true;
    } else {
      this.buttonsEnabled = false;
    }
  }

}
