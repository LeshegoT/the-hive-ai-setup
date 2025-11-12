import { Component, effect, OnInit, signal, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { StaffOverviewFilterParameters, StaffOverviewListItem } from '../../../shared/interfaces';
import { StaffOverviewReview, StaffOverviewService } from '../../services/staff-overview.service';
import { BehaviorSubject, Subscription, switchMap } from 'rxjs';

@Component({
    selector: 'app-staff-overview',
    templateUrl: './staff-overview.tab.html',
    styleUrls: ['./staff-overview.tab.css', '../../styles/reviewShared.css'],
    standalone: false
})
  export class StaffOverviewComponent implements OnInit, OnDestroy {
    
    staffOverviewData: MatTableDataSource<StaffOverviewListItem>;
    reviews: Array<StaffOverviewReview> = [];
    filterParameters = new BehaviorSubject<StaffOverviewFilterParameters>({});
    subscriptions: Subscription[] = [];

    readonly selectedStaff = signal<StaffOverviewListItem | undefined>(undefined);

    constructor(
      public staffOverviewService: StaffOverviewService
    ) {
      effect(() => this.viewReviews(this.selectedStaff()));
    }

    ngOnInit() {
      this.updateReviewData(undefined);

      const subscription = this.filterParameters.pipe(
        switchMap((filterParameters) => 
           this.staffOverviewService.getAllStaffOverview(filterParameters)
        )
      ).subscribe((staffOverviews) => {
        this.staffOverviewData = staffOverviews.map((staffOverview) => 
        ({
          displayName: staffOverview.displayName,
          upn: staffOverview.userPrincipleName,
          unit: staffOverview.department,
          staffType: staffOverview.staffType,
          joinedDate: staffOverview.joinedDate,
          staffId: staffOverview.staffId,
          reviewer: staffOverview.reviewer,
          entity: staffOverview.entity,
          nextReview: {
            id: staffOverview.staffReviewId,
            templateName: staffOverview.nextFeedbackType,
            date: staffOverview.nextReviewDate ? new Date(staffOverview.nextReviewDate) : undefined
          },
          currentReview: {
            id: staffOverview.currentStaffReviewId,
            templateName: staffOverview.currentFeedbackType,
            date: staffOverview.currentReviewDate ? new Date(staffOverview.currentReviewDate) : undefined,
            currentHrRepDisplayName: staffOverview.currentHrRepDisplayName
          }
        }));
      });

      this.subscriptions.push(subscription);
    }

    ngOnDestroy() {
      this.subscriptions.forEach((s) => s.unsubscribe());
    }
  
    updateReviewData(filterParameters: StaffOverviewFilterParameters) {
      this.staffOverviewData = undefined;
      this.filterParameters.next(filterParameters);
      this.viewReviews();
    }

    viewReviews(staffMember: StaffOverviewListItem | undefined = undefined){
      if(staffMember !== undefined){
        const staffId = staffMember.staffId;
        this.reviews = undefined;
        this.staffOverviewService.getReviewsForStaffMember(staffId).subscribe((reviews) => {
          this.reviews = reviews;
        });
      } else {
        this.reviews = [];
      }
    }

    reloadStaffOverviewData() {
      const currentfilters = this.filterParameters.getValue();
      this.staffOverviewData = undefined;
      this.filterParameters.next(currentfilters);
      this.viewReviews();
    }
  }