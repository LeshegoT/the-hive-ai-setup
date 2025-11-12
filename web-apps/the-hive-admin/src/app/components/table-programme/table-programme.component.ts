import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { ProgrammeService } from '../../services/programme.service';
import { TableService } from '../../services/table.service';

export interface ProgrammeData {
  programmeID: number;
  startDate: Date;
  period: number;
  name: string;
  levelups: {
    levelUpId: number;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    programmeID: number;
  }[];
  users: {
    displayName: string;
    upn: string;
    dateAdded: Date;
  }[];
}

@Component({
    selector: 'app-table-programme',
    templateUrl: './table-programme.component.html',
    styleUrls: ['./table-programme.component.css'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})
export class TableProgrammeComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('programmeTable') programmeTable: MatTable<Element>;
  private dataSubscription = new Subscription();
  @Output() triggerRefresh = new EventEmitter();
  @Input() allProgrammes: ProgrammeData[]

  columns = ['programmeId', 'name', 'period', 'startDate', 'actions'];

  filter = '';
  creating = false;
  programmeData = new MatTableDataSource<ProgrammeData>();
  defaultProgramme: ProgrammeData;
  newProgrammeValues: ProgrammeData;
  selectedProgramme: ProgrammeData | null = null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private snackBar: MatSnackBar,
    public tableService: TableService,
    private programmeService: ProgrammeService
  ) {}

  ngOnInit() {
    this.defaultProgramme = {
      programmeID: null,
      startDate: new Date(0),
      period: null,
      name: '',
      levelups: [],
      users: [],
    };
    this.refreshData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['allProgrammes']) {
      this.allProgrammes = changes['allProgrammes'].currentValue;
      this.refreshData();
    }
    else {
      //If there is no change in the data don't refresh it.
    }
  }

  ngAfterViewInit() {
    this.programmeData.paginator = this.paginator;
    this.programmeData.paginator.firstPage();
    this.programmeData.sort = this.sort;
    const sortFunctionHandle = this.programmeData.sortData;
    this.programmeData.sortData = (data, sort) => {
      if (!sort.active || sort.direction === '') {
        return sortFunctionHandle(data, sort);
      }
      return sortFunctionHandle(data, sort);
    };
  }
  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  refreshData() {
    if (this.allProgrammes) {
      this.programmeData.data = this.allProgrammes;
    }
  }

  updateSelected(programme) {
    this.creating = false;
    this.selectedProgramme = this.selectedProgramme ? null : programme;
  }

  applyFilter($event) {
    this.programmeData.filter = $event.trim().toLowerCase();
    if (this.programmeData.paginator) {
      this.programmeData.paginator.firstPage();
    }
  }

  cancelCreate() {
    this.creating = false;
    this.selectedProgramme = null;
  }

  newProgramme() {
    this.newProgrammeValues = { ...this.defaultProgramme };
    this.selectedProgramme = null;
    this.creating = true;
  }

  deleteProgramme(programme: ProgrammeData) {
    try {
      const deleteSubscription = this.programmeService.deleteProgramme(programme.programmeID).subscribe((res) => {
        this.snackBar.open('Programme deleted successfully', '', { duration: 2000 });
        this.removeProgrammeFromDataSource(programme);
        this.triggerRefresh.emit(programme.programmeID);
        this.dataSubscription.add(deleteSubscription);
      });
    } catch (error) {
      this.snackBar.open('Programme delete failed.' + error, '', { duration: 2000 });
    }
  }

  removeProgrammeFromDataSource(programme: ProgrammeData) {
    const index = this.programmeData.data.indexOf(programme);
    this.programmeData.data.splice(index, 1);
    this.programmeTable.renderRows();
    this.programmeData._updateChangeSubscription();
  }

  updateProgramme(updatedProgramme) {
    try {
      let updateSubscription;
      if (this.selectedProgramme) {
        updateSubscription = this.programmeService.updateProgramme(updatedProgramme).subscribe(() => {
          this.snackBar.open('Programme Updated successfully', '', { duration: 2000 });
          this.triggerRefresh.emit();
        });
      }
      this.creating = false;
      this.selectedProgramme = null;
      this.dataSubscription.add(updateSubscription);
    } catch {
      this.snackBar.open('Programme Update was unsuccessful.', '', { duration: 2000 });
    }
  }

  emitRefresh() {
    this.selectedProgramme = undefined;
    this.triggerRefresh.emit();
  }
}
