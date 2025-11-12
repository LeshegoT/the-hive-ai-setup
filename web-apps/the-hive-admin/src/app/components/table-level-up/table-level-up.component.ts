import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit, Output, ViewChild, EventEmitter, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { LevelUpService } from '../../services/level-up.service';
import { TableService } from '../../services/table.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LevelUpWarningDialogComponent } from '../level-up-warning-dialog/level-up-warning-dialog.component';

@Component({
    selector: 'app-table-level-up',
    templateUrl: './table-level-up.component.html',
    styleUrls: ['./table-level-up.component.css'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})
export class TableLevelUpComponent implements OnInit, OnDestroy {
  private dataSubscription: Subscription = new Subscription();

  @Output() triggerRefresh = new EventEmitter();
  private _allLevelUps = [];
  @Input()
  set allLevelUps(allLevelUps) {
    this._allLevelUps = allLevelUps;
    this.refreshData();
  }
  get allLevelUps() {
    return this._allLevelUps;
  }
  levelUpFormated: LevelUpInterface[];
  defaultLevelUp: LevelUpInterface;
  newLevelUpValues: LevelUpInterface;

  filter = '';
  creating = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<any>;

  levelUpData: MatTableDataSource<LevelUpInterface>;
  columns = ['levelUpId', 'name', 'icon', 'description', 'startDate', 'endDate', 'actions']; 
  expandedLevelUp: LevelUpInterface | null;

  constructor(private snackBar: MatSnackBar, private levelUpService: LevelUpService, public tableService: TableService, public dialog: MatDialog) {}

  ngOnInit() {
    this.refreshData();

    this.defaultLevelUp = {
      name: 'New Level Up',
      icon: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(),
      created: false,
      levelUpId: 0,
      courseIds: [],
    };
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  refreshData() {
    this.levelUpService.getAllLevelUps().subscribe(allLevelUps => {
      this.levelUpData = new MatTableDataSource<LevelUpInterface>(allLevelUps);
      this.levelUpData.paginator = this.paginator;
      if(this.levelUpData.paginator) {
        this.levelUpData.sort = this.sort;
        this.levelUpData.paginator.firstPage();
      } else {
        //nothing because levelUpData is initially undefined
      }
    })
  }

  updateSelected(levelUp) {
    const sameLevelUp = this.expandedLevelUp === levelUp;
    this.creating = false;
    this.expandedLevelUp = sameLevelUp ? null : levelUp;
  }

  cancelCreate() {
    this.creating = false;
  }

  onSave(levelUp) {
    let updateSubscription;
    if (this.expandedLevelUp) {
      updateSubscription = this.levelUpService.updateLevelUp(levelUp).subscribe(() => {
        this.snackBar.open('Level Up updated successfully', '', { duration: 2000 });
      });
    } else {
      updateSubscription = this.levelUpService.createLevelUp(levelUp).subscribe(() => {
        this.snackBar.open('Level Up created successfully', '', { duration: 2000 });
        this.triggerRefresh.emit(levelUp);
        this.newLevelUpValues = { ...this.defaultLevelUp };
      });
    }
    this.expandedLevelUp = null;
    this.creating = false;
    this.dataSubscription.add(updateSubscription);
  }

  deleteLevelUp(levelUpId: number) {
    const deleteSubscription = this.levelUpService.deleteLevelUp(levelUpId).subscribe(() => {
      this.snackBar.open('Level Up deleted successfully', '', { duration: 2000 });
      this.triggerRefresh.emit(levelUpId);
    },(error) => {
      this.snackBar.open(error, '', { duration: 5000 });
    });
    this.dataSubscription.add(deleteSubscription);
  }

  openWarningDialog(levelUpId: number) {
    let dialogRef: MatDialogRef<LevelUpWarningDialogComponent>;

    dialogRef = this.dialog.open(LevelUpWarningDialogComponent, {
      data: {
        warningMessage: 'Warning! Are you sure you want to delete? You will lose all current data for this level-up.'
      },
    })

    dialogRef.componentInstance.onConfirmClicked.subscribe(() => {
      dialogRef.afterClosed().subscribe(() => {
        this.deleteLevelUp(levelUpId);
        dialogRef.componentInstance.onConfirmClicked.unsubscribe();
      })
    })
  }

  applyFilter($event) {
    const filterValue = $event;
    this.levelUpData.filter = filterValue.trim().toLowerCase();

    if (this.levelUpData.paginator) {
      this.levelUpData.paginator.firstPage();
    }
  }

  newLevelUp() {
    if (!this.expandedLevelUp || this.expandedLevelUp.created) {
      this.expandedLevelUp = null;
      this.newLevelUpValues = { ...this.defaultLevelUp };
      this.filter = '';
      this.levelUpData.filter = '';
      this.levelUpData.paginator.lastPage();
      this.creating = true;
    }
  }
}

export interface LevelUpInterface {
  name: string;
  icon: string;
  levelUpId: number;
  startDate: Date;
  endDate: Date;
  description: string;
  created: boolean;
  courseIds: [];
  totalAttendees ?: number;
}