import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Assignment, AssignmentTrackingFilterParameters, AssignmentTrackingListItem, Person } from '../../../shared/interfaces';
import { AssignmentTrackingService } from '../../services/assignment-tracking.service';
import { Subject, switchMap } from 'rxjs';

@Component({
    selector: 'app-assignment-tracking',
    templateUrl: './assignment-tracking.tab.html',
    styleUrls: ['./assignment-tracking.tab.css', '../../styles/reviewShared.css'],
    standalone: false
})
  export class AssignmentTrackingComponent implements OnInit {
    
    assignmentTrackingData: MatTableDataSource<AssignmentTrackingListItem>;
    assignmentTrackingColumns: string[] = ["displayName","upn","unit","manager","jobTitle","numberOfOutstandingAssignments", "entity", 'mostOutstanding'];
    feedbackAssignmentColumns = ['reviewee', 'HR Rep','review type','dueDate', 'last accessed', 'status'];
    feedbackAssignments: Array<Assignment> = [];
    currentReviewUPN = "";
    selectedStaffMember: Person;
    handleFeedbackAssignments$ = new Subject<string>();

    constructor(
      public assignmentTrackingService: AssignmentTrackingService
    ) {}

    ngOnInit() {
      this.updateFeedbackAssignmentData({
        searchText: undefined,
        selectedStaffMember: undefined
      });
      this.initializeHandleFeedbackAssignments();
    }
  
    initializeHandleFeedbackAssignments() {
      this.handleFeedbackAssignments$.pipe(
        switchMap((upn) =>
          this.assignmentTrackingService.getFeedbackAssignmentsForStaffMember(upn)
        )
      ).subscribe({
        next: (feedbackAssignments) => this.feedbackAssignments = feedbackAssignments
      });
    }

    updateFeedbackAssignmentData(filterParameters: AssignmentTrackingFilterParameters) {
      this.selectedStaffMember = filterParameters.selectedStaffMember;
      this.assignmentTrackingData = undefined;
      this.assignmentTrackingService.getAllAssignmentTracking(filterParameters).subscribe((assignmentTracking) => {
        this.assignmentTrackingData = assignmentTracking.map((assignmentTracking) => 
        ({
          displayName: assignmentTracking.displayName,
          upn: assignmentTracking.userPrincipleName,
          unit: assignmentTracking.department,
          staffId: assignmentTracking.staffId,
          department: assignmentTracking.department,
          manager: assignmentTracking.manager,
          jobTitle: assignmentTracking.jobTitle,
          numberOfOutstandingAssignments : assignmentTracking.numberOfOutstandingAssignments,
          entity: assignmentTracking.entityDescription,
          mostOutstanding : assignmentTracking.mostOutstanding
        }));
      });
        this.viewFeedbackAssignments();
    }

    viewFeedbackAssignments(staffMember = undefined){
      if(staffMember !== undefined){
        const upn = staffMember.upn;
        this.feedbackAssignments = undefined;
        this.handleFeedbackAssignments$.next(upn)
      } else {
        this.feedbackAssignments = [];
      }
    }
  }