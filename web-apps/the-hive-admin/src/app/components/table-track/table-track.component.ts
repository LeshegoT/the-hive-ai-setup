import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { TracksService } from '../../services/tracks.service';
import { TableService } from '../../services/table.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-table-track',
    templateUrl: './table-track.component.html',
    styleUrls: ['./table-track.component.css'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})
export class TableTrackComponent implements OnInit, AfterViewInit {
  private dataSubscription = new Subscription();
  @Output() triggerRefresh = new EventEmitter();
  private _allTracks = [];
  @Input()
  set allTracks(allTracks) {
    this._allTracks = allTracks;
    this.refreshData();
  }
  get allTracks() {
    return this._allTracks;
  }
  filter = '';
  creating = false;
  trackForm: UntypedFormGroup|undefined = undefined;

  columns = ['trackId', 'name', 'code', 'icon','actions'];

  expandedTrack: TracksInterface;
  newTrackValues: TracksInterface;
  tracksFormatted: TracksInterface[];
  trackData = new MatTableDataSource<TracksInterface>();
  existingCodes = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private snackBar: MatSnackBar, private tracksService: TracksService, public tableService: TableService, private formBuilder: UntypedFormBuilder) {}

  ngOnInit() {
    this.refreshData();
  }

  ngAfterViewInit() {
    this.trackData.paginator = this.paginator;
    this.trackData.paginator.firstPage();
    this.trackData.sort = this.sort;
  }

  refreshData() {
    if(this.allTracks) {
      this.tracksFormatted = this.allTracks.map((element) => {
        const newFormat: TracksInterface = {
          trackId: element.trackId,
          name: element.name,
          code: element.code,
          icon: element.icon,
          restricted: element.restricted,
          courseIds: element.courseIds,
        };
        return newFormat;
      });
      this.trackData.data = this.tracksFormatted;
      this.existingCodes = this.tracksFormatted.map((track) => track.code);
    }
  }

  updateSelected(track) {
    const sameTrack = this.expandedTrack === track;
    this.creating = false;
    this.expandedTrack = sameTrack ? undefined : track;
  }

  applyFilter($event) {
    const filterValue = $event;
    this.trackData.filter = filterValue.trim().toLowerCase();
    if (this.trackData.paginator) {
      this.trackData.paginator.firstPage();
    }
  }

  checkDetailExpand(track) {
    if (track === this.expandedTrack) {
      return 'expanded';
    } else {
      return 'collapsed';
    }
  }
  checkCreateExpand() {
    if (this.creating) {
      return 'expanded';
    } else {
      return 'collapsed';
    }
  }

  enableCreate() {
    this.trackForm =  this.formBuilder.group({
      code: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(/^[a-z\-]+$/),
          Validators.maxLength(50)
        ])
      ],
      name: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(50)
        ])
      ],
      icon: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(50)
        ])
      ],
      course: [
        ''
      ],
      restrictions: [
        ''
      ]
    });
  }

  reload() {
    this.triggerRefresh.emit();
    this.cancelCreate()
  }

  cancelCreate() {
    this.trackForm = undefined;
  }

  cancelEdit() {
    this.expandedTrack = undefined;
  }

  updateTrack(track) {
    const indexNew = this.existingCodes.indexOf(track.code);
    const indexOld = this.expandedTrack ? this.existingCodes.indexOf(this.expandedTrack.code) : -1;
    const sameCode = indexNew === indexOld;
    const foundNew = indexNew === -1;
    let updateSubscription;
    if(sameCode || foundNew) {
      if(this.expandedTrack) {
        updateSubscription = this.tracksService.updateTrack(track).subscribe(() => {
          this.snackBar.open('Track Updated successfully', '', { duration: 2000 });
          this.expandedTrack = track;
          this.triggerRefresh.emit();
        });
      } else {
        //Creating a track is handled by another component
      }
      this.creating = false;
      this.expandedTrack = undefined;
      this.dataSubscription.add(updateSubscription);
    } else {
      this.snackBar.open('Cannot allow duplicate code', '', { duration: 2000 });
    }
  }
  deleteTrack(track) {
    const trackId =track.trackId;
    const deleteSubscription = this.tracksService.deleteTrack(trackId).subscribe(() => {
      this.snackBar.open('Track deleted successfully', '', { duration: 2000 });
      this.triggerRefresh.emit(trackId);
    });
    this.dataSubscription.add(deleteSubscription);
  }
}

export interface TracksInterface {
  trackId: number;
  code: string;
  name: string;
  icon: string;
  restricted: boolean;
  courseIds: number[];
}
