import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { LevelUpService } from '../../services/level-up.service';
import { SideQuestService } from '../../services/side-quest.service';
import { contentTypeCodes } from '../../shared/enums';
import { TableService } from '../../services/table.service';

@Component({
    selector: 'app-table-type',
    templateUrl: './table-type.component.html',
    styleUrls: ['./table-type.component.css'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})
export class TableTypeComponent implements OnInit, AfterViewInit, OnDestroy {
  private dataSubscription = new Subscription();

  @Output() triggerRefresh = new EventEmitter();

  private _allTypes = [];
  @Input()
  set allTypes(allTypes) {
    this._allTypes = allTypes;
    this.refreshData();
  }
  get allTypes() {
    return this._allTypes;
  }
  @Input() updateMethod: string;
  @Input() createMethod: string;
  @Input() deleteMethod: string;
  @Input() contentType: contentTypeCodes;
  @Input() activeTypes: number[] = [];

  private typeService: LevelUpService | SideQuestService;

  typeFormatted: TypeInterface[];
  defaultType: TypeInterface;
  newTypeValues: TypeInterface;
  expandedType: TypeInterface | null = null;
  cachedType: TypeInterface | null;
  existingTypes = [];

  filter = '';
  creating = false;

  typeData = new MatTableDataSource<TypeInterface>();
  imageMethod: string;

  columns = ['id', 'name', 'code', 'icon', 'actions'];


  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  constructor(
    private snackBar: MatSnackBar,
    private levelUpService: LevelUpService,
    private sideQuestService: SideQuestService,
    public tableService: TableService
  ) {}

  ngOnInit() {
    switch (this.contentType) {
      case contentTypeCodes.sideQuestType:
        this.typeService = this.sideQuestService;
        this.imageMethod = 'getSideQuestTypeImages';
        break;
      case contentTypeCodes.levelUpActivityType:
        this.typeService = this.levelUpService;
        this.imageMethod = 'getLevelUpActivityTypeIcons';
        break;
    }

    this.refreshData();

    this.defaultType = {
      id: null,
      name: '',
      code: '',
      icon: '',
      description: '',
    };
  }

  ngAfterViewInit() {
    this.typeData.paginator = this.paginator;
    this.typeData.paginator.firstPage();
    this.typeData.sort = this.sort;
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  refreshData() {
    this.typeFormatted = this.allTypes.map((element) => {
      const newFormat: TypeInterface = {
        id: element.sideQuestTypeId | element.levelUpActivityTypeId,
        name: element.name,
        description: element.description,
        code: element.code,
        icon: element.icon,
      };
      return newFormat;
    });
    this.typeData.data = this.typeFormatted;
    this.existingTypes = this.typeFormatted.map(type => type.code);
  }

  updateSelected(type) {
    const sameType = this.expandedType === type;
    this.creating = false;
    this.expandedType = sameType ? null : type;
    this.cachedType = { ...this.expandedType };
  }

  applyFilter($event) {
    const filterValue = $event;
    this.typeData.filter = filterValue.trim().toLowerCase();
    if (this.typeData.paginator) {
      this.typeData.paginator.firstPage();
    }
  }

  cancelCreate() {
    this.creating = false;
    this.expandedType = null;
  }

  checkDelete(typeName: TypeInterface): boolean {
    if (this.activeTypes.indexOf(typeName.id) === -1) {
      return typeName !== this.expandedType;
    } else {
      return true;
    }
  }

  toolTipMessage(typeName: TypeInterface):string {
    if (this.activeTypes.indexOf(typeName.id) === -1) {
      return typeName !== this.expandedType ? 'Open Type To Delete' : 'Delete Type';
    } else {
      return 'Cannot Delete, Type In Use';
    }
  }

  onSave(type) {
    const indexNew = this.existingTypes.indexOf(type.code);
    const indexOld = this.cachedType ? this.existingTypes.indexOf(this.cachedType.code) : -1;
    const sameCode = indexNew == indexOld;
    const foundNew = indexNew === -1;
    let updateSubscription;
    if(sameCode || foundNew) {
      if (this.expandedType) {
        updateSubscription = this.typeService[this.updateMethod](type).subscribe(() => {
          this.snackBar.open('Type successfully updated', '', { duration: 2000 });
          this.triggerRefresh.emit(type);
        });
      } else {
        updateSubscription = this.typeService[this.createMethod](type).subscribe(() => {
          this.snackBar.open('Type successfully created', '', { duration: 2000 });
          this.triggerRefresh.emit(type);
          this.newTypeValues = { ...this.defaultType };
        });
      }

      this.expandedType = null;
      this.creating = false;
      this.dataSubscription.add(updateSubscription);
    } else {
      this.snackBar.open('Cannot allow duplicate codes', '', { duration: 2000 });
    }
  }

  deleteType(type) {
    const { id } = type;
    const deleteSubscription = this.typeService[this.deleteMethod](id).subscribe(() => {
      this.snackBar.open('Side Quest Type successfully deleted', '', { duration: 2000 });
      this.triggerRefresh.emit(id);
    });
    this.dataSubscription.add(deleteSubscription);
  }

  newType() {
    this.newTypeValues = { ...this.defaultType };
    this.expandedType = null;
    this.creating = true;
  }

  checkDetailExpand(typeName) {
    if (typeName === this.expandedType) {
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
}

export interface TypeInterface {
  id: number;
  code: string;
  name: string;
  icon: string;
  description: string;
}
