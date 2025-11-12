import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { GuidesService } from '../../services/guides.service';
import { TableService } from '../../services/table.service';
import { Guide, NewGuideRequest, RequestStatusType } from '../../shared/interfaces';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { TextInputDialogComponent } from '../../text-input-dialog/text-input-dialog.component';

type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
type GuideStatus = 'active' | 'pending-delete' | 'deleted';

@Component({
    selector: 'app-guide-monitor',
    templateUrl: './guide-monitor.component.html',
    styleUrls: ['./guide-monitor.component.css'],
    standalone: false
})
export class GuideMonitorComponent implements OnInit, OnDestroy {
  private dataSubscription: Subscription = new Subscription();
  guides: MatTableDataSource<Guide>;
  newGuideRequests: MatTableDataSource<NewGuideRequest>;

  @ViewChild("guideSort") set guideSort(sort: MatSort) {
    if (this.guides !== undefined) {
      this.guides.sort = sort;
    } else {
      // Cannot set sort since the guide table is not initialised because the data hasn't been retrieved
    }
  }
  @ViewChild("newGuideRequestsSort") set newGuideRequestsSort(sort: MatSort) {
    if (this.newGuideRequests !== undefined) {
      this.newGuideRequests.sort = sort;
    } else {
      // Cannot set sort since the new guide requests table is not initialised because the data hasn't been retrieved
    }
  }
  @ViewChild("guidePaginator") set guidePaginator(paginator: MatPaginator) {
    if (this.guides !== undefined) {
      this.guides.paginator = paginator;
    } else {
      // Cannot set the paginator since the guide table is not initialised because the data hasn't been retrieved
    }
  }
  @ViewChild("newGuideRequestsPaginator") set newGuideRequestsPaginator(paginator: MatPaginator) {
    if (this.newGuideRequests !== undefined) {
      this.newGuideRequests.paginator = paginator;
    } else {
      // Cannot set the paginator since the new guide requests table is not initialised because the data hasn't been retrieved
    }
  }

  guidesColumns = ['userPrincipleName', 'specialisations', 'heroes', 'guideStatus', 'lastGuideActivityDate', 'controls'];
  newGuideRequestColumns = ['upn', 'specialisation', 'dateRequested', 'requestStatusType', 'bio', 'controls']

  requestStatusTypes: RequestStatusType[] = [];

  selectedGuide?: Guide;

  constructor(private guidesService: GuidesService, 
              private snackBar: MatSnackBar, 
              public tableService: TableService,
              public dialog: MatDialog) {}

  ngOnInit() {
    this.getGuides();
    this.getNewGuideRequests();
    this.getRequestStatusTypes();
  }

  getGuides() {
    const guidesSubscription = this.guidesService.getAllGuides().subscribe((guides) => {
      this.guides = new MatTableDataSource<Guide>(guides);
    });

    this.dataSubscription.add(guidesSubscription);
  }

  getNewGuideRequests() {
    this.guidesService.getNewGuideRequests().subscribe((allNewGuideRequests) => {
      this.newGuideRequests = new MatTableDataSource<NewGuideRequest>(allNewGuideRequests);
    });
  }

  getRequestStatusTypes() {
    this.guidesService.getRequestStatusTypes().subscribe((requestStatusTypes) => {
      this.requestStatusTypes = requestStatusTypes;
    })
  }

  updateGuideStatus(guide: Guide, status: GuideStatus, event: MouseEvent) {
    guide.guideStatus = status;
    this.guidesService.updateGuide(guide).subscribe({
      next: (_res) => {
        this.getGuides();
        this.snackBar.open('The guide status has been successfully updated.', 'Dismiss', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error, 'Dismiss', { duration: 3000 });
      }
    })
    event.stopPropagation();
  }

  updateNewGuideRequestStatus(newGuideRequest: NewGuideRequest, status: RequestStatus) {
    const requestStatus = this.requestStatusTypes.find((requestStatusType) => requestStatusType.requestStatusType == status);
    newGuideRequest.requestStatusTypeId = requestStatus.requestStatusTypeId;
    newGuideRequest.requestStatusType = requestStatus.requestStatusType;

    if (status === 'REJECTED') {
      this.openRejectionReasonDialog(newGuideRequest).subscribe(rejectionReason => {
        if (rejectionReason) {
          newGuideRequest.requestStatusReason = rejectionReason;
          this.updateGuideRequest(newGuideRequest);
        } else {
          this.snackBar.open('New guide request status was not updated because a rejection reason was not provided.', 'Dismiss', { duration: 3000 });
        }
      });
    } else {
      this.updateGuideRequest(newGuideRequest);
    }
  }

  updateGuideRequest(newGuideRequest: NewGuideRequest) {
    this.guidesService.updateNewGuideRequests(newGuideRequest).subscribe({
      next: () => {
        this.getGuides();
        this.getNewGuideRequests();
        this.snackBar.open('New guide request status successfully updated.', 'Dismiss', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error, 'Dismiss', { duration: 3000 });
      }
    });
  }

  openRejectionReasonDialog(newGuideRequest: NewGuideRequest) {
    const dialogRef = this.dialog.open(TextInputDialogComponent, {
      width: '60em',
      data: {
        currentText: '',
        editable: true,
        title: `Guide Application for ${newGuideRequest.upn} - Specialization: ${newGuideRequest.specialisation}`,
        placeholder: 'Please enter the reason for the guide application rejection.',
        inputLabel: 'Rejection Reason'
      }
    });

    return dialogRef.afterClosed();
  }

  canUpdateGuideRequestStatus(newGuideRequest: NewGuideRequest) {
    return newGuideRequest.requestStatusType == 'PENDING';
  }

  getNewGuideRequestStatusColour(newGuideRequest: NewGuideRequest): string {
    return `guide-${newGuideRequest.requestStatusType.toLowerCase()}-status`;
  }

  getGuideStatusColour(guide: Guide): string {
    return `guide-${guide.guideStatus}-status`;
  }

  selectGuide(guide: Guide) {
    this.selectedGuide = guide;
  }

  unselectGuide() { 
    this.selectedGuide = undefined;
  }

  handleGuideSaved() {
    this.getGuides();
    this.selectedGuide = undefined;
  }

  encode(upn) {
    return btoa(upn);
  }

  applyFilter(filterValue: string) {
    this.guides.filter = filterValue.trim().toLowerCase();
  }

  applyNewGuideRequestFilter(filterValue: string) {
    this.newGuideRequests.filter = filterValue.trim().toLowerCase();
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}

