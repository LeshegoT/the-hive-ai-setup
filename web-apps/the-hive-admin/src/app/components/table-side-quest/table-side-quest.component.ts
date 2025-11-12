import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { SideQuestService } from '../../services/side-quest.service';
import { TableService } from '../../services/table.service';

@Component({
    selector: 'app-table-side-quest',
    templateUrl: './table-side-quest.component.html',
    styleUrls: ['./table-side-quest.component.css'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})
export class TableSideQuestComponent implements OnInit, AfterViewInit, OnDestroy {
  private dataSubscription = new Subscription();

  @Output() triggerRefresh = new EventEmitter();
  private _allSideQuests = [];
  @Input()
  set allSideQuests(allSideQuests) {
    this._allSideQuests = allSideQuests;
    this.refreshData();
  }
  get allSideQuests() {
    return this._allSideQuests;
  }

  sideQuestFormatted: SideQuestInterface[];
  defaultSideQuest: SideQuestInterface;
  newSideQuestValues: SideQuestInterface;
  expandedSideQuest: SideQuestInterface | null = null;

  filter = '';
  creating = false;

  sideQuestData = new MatTableDataSource<SideQuestInterface>();

  columns = ['id', 'name', 'type', 'venue', 'description', 'date', 'actions'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private sideQuestService: SideQuestService, private snackBar: MatSnackBar, public tableService: TableService) {}

  ngOnInit() {
    this.refreshData();

    this.defaultSideQuest = {
      id: null,
      name: '',
      type: '',
      venue: '',
      description: '',
      startDate: new Date(Date.now() + 60 * 60 * 1000),
      link: '',
      registrationRequired: false,
      external: false,
      code: '',
    };
  }

  ngAfterViewInit() {
    this.sideQuestData.paginator = this.paginator;
    this.sideQuestData.paginator.firstPage();
    this.sideQuestData.sort = this.sort;
    this.sideQuestData.sortingDataAccessor = (item, property): string | number => {
      switch (property) {
        case 'date':
          return new Date(item.startDate).getTime();
        default:
          return item[property];
      }
    };
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  refreshData() {
    this.sideQuestFormatted = this.allSideQuests.map((element) => {
      const newFormat: SideQuestInterface = {
        id: element.id,
        name: element.name,
        type: element.typeName,
        venue: element.venue,
        description: element.description,
        startDate: new Date(element.startDate),
        link: element.link,
        registrationRequired: element.registrationRequired,
        external: element.externalEvent,
        code: element.code,
      };
      return newFormat;
    });
    this.sideQuestData.data = this.sideQuestFormatted;
  }

  applyFilter($event) {
    const filterValue = $event;
    this.sideQuestData.filter = filterValue.trim().toLowerCase();

    if (this.sideQuestData.paginator) {
      this.sideQuestData.paginator.firstPage();
    }
  }

  newSideQuest() {
    this.newSideQuestValues = { ...this.defaultSideQuest };
    this.filter = '';
    this.sideQuestData.filter = '';
    this.expandedSideQuest = null;
    this.sideQuestData.paginator.lastPage();
    this.creating = true;
  }

  deleteSideQuest(sideQuest) {
    const { id } = sideQuest;
    this.sideQuestService.countSideQuestMission(id).subscribe((sideQuestMission)=>{
    if(sideQuestMission==0){
      const deleteSubscription = this.sideQuestService.deleteSideQuest(id).subscribe(() => {
      this.snackBar.open('Side Quest deleted successfully', '', { duration: 2000 });
      this.triggerRefresh.emit(id);
    });
    this.dataSubscription.add(deleteSubscription);
    }
    else{
      this.snackBar.open('This sidequest cannot be deleted because it is part of at least one user \'s mission.', '', {
        duration: 2000,
      });
    }
  });
  }

  updateSelected(sideQuest) {
    const sameSideQuest = this.expandedSideQuest === sideQuest;
    this.creating = false;
    this.expandedSideQuest = sameSideQuest ? null : sideQuest;
  }

  cancelCreate() {
    this.creating = false;
    this.expandedSideQuest = null;
  }

  onSave(sideQuest) {
    let updateSubscription;
    if (this.expandedSideQuest) {
      updateSubscription = this.sideQuestService.updateSideQuest(sideQuest).subscribe(() => {
        this.snackBar.open('Side Quest updated successfully', '', { duration: 2000 });
      });
    } else {
      updateSubscription = this.sideQuestService.createSideQuest(sideQuest).subscribe(() => {
        this.snackBar.open('Side Quest created successfully', '', { duration: 2000 });
        this.triggerRefresh.emit(sideQuest);
        sideQuest.created = true;
        this.newSideQuestValues = { ...this.defaultSideQuest };
      });
    }

    this.expandedSideQuest = null;
    this.creating = false;
    this.dataSubscription.add(updateSubscription);
  }

  checkDetailExpand(sideQuest): string {
    if(sideQuest === this.expandedSideQuest) {
      return 'expanded';
    } else {
      return 'collapsed';
    }
  }

  checkCreateExpand(): string {
    if (this.creating) {
      return 'expanded';
    } else {
      return 'collapsed';
    }
  }
}

export interface SideQuestInterface {
  id: number;
  name: string;
  type: string; //TODO: remove references of type
  venue: string;
  description: string;
  startDate: Date;
  link: string;
  registrationRequired: boolean;
  external: boolean;
  code: string;
}
