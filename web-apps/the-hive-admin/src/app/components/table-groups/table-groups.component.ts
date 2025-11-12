import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { GroupService } from '../../services/group.service';
import { TableService } from '../../services/table.service';

@Component({
    selector: 'app-table-groups',
    templateUrl: './table-groups.component.html',
    styleUrls: ['./table-groups.component.css'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})
export class TableGroupsComponent implements OnInit, AfterViewInit, OnDestroy {
  private dataSubscription = new Subscription();

  filter = '';
  creating = false;
  groupData = new MatTableDataSource<GroupInterface>();
  defaultGroup: GroupInterface;
  newGroupValues: GroupInterface;
  cachedGroup: GroupInterface;
  expandedGroup: GroupInterface | null;
  columns = ['groupName', 'members', 'actions'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @Output() triggerRefresh = new EventEmitter();
  private _allGroups = [];
  @Input()
  set allGroups(allGroups) {
    this._allGroups = allGroups;
    this.refreshData();
  }
  get allGroups() {
    return this._allGroups;
  }
  groupFormatted: GroupInterface[];
  constructor(private snackBar: MatSnackBar, private groupService: GroupService, public tableService: TableService) {}

  ngOnInit() {
    this.refreshData();
    this.defaultGroup = {
      groupName: 'New Group',
      members: [],
    };
  }

  ngAfterViewInit() {
    this.groupData.paginator = this.paginator;
    this.groupData.paginator.firstPage();
    this.groupData.sort = this.sort;
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  refreshData() {
    this.groupFormatted = this.allGroups;
    this.groupData.data = this.groupFormatted;
  }

  applyFilter($event) {
    const filterValue = $event;
    this.groupData.filter = filterValue.trim().toLowerCase();
    if (this.groupData.paginator) {
      this.groupData.paginator.firstPage();
    }
  }

  checkDetailExpand(group) {
    if (group === this.expandedGroup) {
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

  newGroup() {
    this.newGroupValues = { ...this.defaultGroup };
    this.creating = true;
  }

  cancelCreate() {
    this.creating = false;
    this.expandedGroup = null;
  }

  updateSelected(group) {
    const sameGroup = this.expandedGroup === group;
    this.creating = false;
    this.expandedGroup = sameGroup ? null : group;
    this.cachedGroup = { ...this.expandedGroup };
  }

  updateGroup(group) {
    const groupNames = this.allGroups.map((group) => group.groupName);
    const indexNew = groupNames.indexOf(group.newName);
    const indexOld = groupNames.lastIndexOf(group.oldName);
    const foundNew = indexNew === -1;
    const sameAsOld = indexOld === indexNew;

    if (sameAsOld || foundNew) {
      let updateSubscription;
      if (this.expandedGroup) {
        updateSubscription = this.groupService.updateGroup(group).subscribe((res) => {
          if (res.statusText === 'completed') {
            this.snackBar.open('Group successfully updated', '', { duration: 2000 });
            this.triggerRefresh.emit(group);
          }
        });
      } else {
        updateSubscription = this.groupService.createGroup(group).subscribe((res) => {
          this.snackBar.open('Group successfully created', '', { duration: 2000 });
          this.newGroupValues = { ...this.defaultGroup };
          this.triggerRefresh.emit();
        });
      }
      this.expandedGroup = null;
      this.creating = null;
      this.dataSubscription.add(updateSubscription);
    } else {
      this.snackBar.open('Cannot allow duplicate Group Names', '', { duration: 2000 });
      this.expandedGroup = { ...this.cachedGroup };
    }
  }
  deleteGroup(group) {
   this.groupService.checkRestrictions(group).subscribe((data)=>{
      if(data>=1){
        this.snackBar.open('The group is currently linked to content restrictions,Can not delete group ', 'Dismis');
      }
      else{
        const deleteSubscription = this.groupService.deleteGroup(group).subscribe(() => {
          this.snackBar.open('Group deleted successfully', '', { duration: 2000 });
          this.triggerRefresh.emit(group);
        });
        this.dataSubscription.add(deleteSubscription);
      }
    })
    
  }
}

export interface GroupInterface {
  groupName: string;
  members: [];
}
