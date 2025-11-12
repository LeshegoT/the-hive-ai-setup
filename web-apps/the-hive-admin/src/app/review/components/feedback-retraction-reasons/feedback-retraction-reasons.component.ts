import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, OnInit, Output, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, NgForm, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { TableService } from '../../../services/table.service';
import { FeedbackRetractionReasonsService } from '../../../review/services/feedback-retraction-reasons.service';

export interface FeedbackRetractionReasons {
  retractionReasonID: number;
  retractionReason: string;
}

@Component({
    selector: 'app-retract-feedback-reason',
    templateUrl: './feedback-retraction-reasons.component.html',
    styleUrls: ['./feedback-retraction-reasons.component.css'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})
export class FeedbackRetractionReason implements OnInit, AfterViewInit, OnDestroy {
  private dataSubscription = new Subscription();
  @Output() triggerRefresh = new EventEmitter();

  activeReasons: number[] = [];
  error = false;
  creating = false;
  filter = '';
  reasonsData = new MatTableDataSource<FeedbackRetractionReasons>();
  columns = ['retractionReasonID', 'retractionReason', 'Action'];
  addReasonForm: UntypedFormGroup;

  @ViewChild('ngForm') parentForm: NgForm;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private snackBar: MatSnackBar,
    public tableService: TableService,
    private retractService: FeedbackRetractionReasonsService,
    private formBuilder: UntypedFormBuilder
  ) {
    this.addReasonForm = this.formBuilder.group({
      retractReason: ['', Validators.compose([Validators.required, Validators.maxLength(50)])],
    });
  }
  ngOnInit() {
    this.refresh();
  }

  ngAfterViewInit() {
    this.reasonsData.paginator = this.paginator;
    this.reasonsData.paginator.firstPage();
    this.reasonsData.sort = this.sort;
  }

  refresh() {
    this.retractService.getRetractedReasons().subscribe((reasons) => {
      this.reasonsData.data = reasons;
    });
  }
  addNewRetractionReason() {
    if (!this.addReasonForm.valid) {
      this.error = true;
      return;
    }
    this.error = false;
    const feedbackRetractionReason = this.addReasonForm.getRawValue();
    const createSubscription = this.retractService.createNewFeedbackRetractionReason(feedbackRetractionReason).subscribe(
      (data) => {
        this.snackBar.open('Feedback Retraction Reason created successfully', '', { duration: 2000 });
        this.addReasonFromDataSource(data);
        this.parentForm.resetForm();
      },
      (error) => {
        this.snackBar.open(`An Error has occured while  creating retraction reason: ${error}`, '', { duration: 2000 });
      }
    );
    this.dataSubscription.add(createSubscription);
  }
  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  applyFilter(filterValue) {
    this.reasonsData.filter = filterValue.trim().toLowerCase();
    if (this.reasonsData.paginator) {
      this.reasonsData.paginator.firstPage();
    }
  }

  cancelCreate() {
    this.creating = false;
  }

  toolTipMessage(retractReason: FeedbackRetractionReasons): string {
    if (this.activeReasons.indexOf(retractReason.retractionReasonID) === -1) {
      return retractReason ? 'Delete Feedback retraction reasons' : '';
    }else {
      return "";
    }
  }

  onSave(reason: FeedbackRetractionReasons) {
    const retract = { retractReason: reason.retractionReason };
    let updateFeedbackRetractionReason;
    updateFeedbackRetractionReason = this.retractService
      .updateFeedbackRetractionReason(reason.retractionReasonID, retract)
      .subscribe(
        () => {
          this.snackBar.open('Feedback Retraction Reason updated successfully', '', { duration: 2000 });
          this.reasonsData.data.map((obj) =>
            obj.retractionReasonID === reason.retractionReasonID ? { ...obj, retractReason: retract } : obj
          );
        },
        (error) => {
          this.snackBar.open(`An Error has occured while  updating retraction reason: ${error}`, '', {
            duration: 2000,
          });
        }
      );
    this.dataSubscription.add(updateFeedbackRetractionReason);
  }
  deleteReason(reason) {
    let updateFeedbackRetractionReason;
    updateFeedbackRetractionReason = this.retractService
      .deleteFeedbackRetrationReason(reason.retractionReasonID)
      .subscribe(
        () => {
          this.snackBar.open('Feedback Retraction Reason deleted successfully', '', { duration: 2000 });
          this.removeReasonFromDataSource(reason);
        },
        (error) => {
          this.snackBar.open(`An Error has occured while  creating deleting reason: ${error}`, '', {
            duration: 2000,
          });
        }
      );
    this.dataSubscription.add(updateFeedbackRetractionReason);
  }
  removeReasonFromDataSource(reason: FeedbackRetractionReasons) {
    const index = this.reasonsData.data.indexOf(reason);
    this.reasonsData.data.splice(index, 1);
    this.reasonsData.data = this.reasonsData.data;
  }
  addReasonFromDataSource(reason) {
    this.reasonsData.data.push(reason);
    this.reasonsData.data = this.reasonsData.data;
    this.creating = false;
  }
  newReason() {
    this.creating = true;
  }
}
