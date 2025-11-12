import { Component, EventEmitter, OnInit, Output, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { TableService } from '../../services/table.service';
import { UnitService } from '../../services/unit.service';

@Component({
    selector: 'app-table-unit',
    templateUrl: './table-unit.component.html',
    styleUrls: ['./table-unit.component.css'],
    standalone: false
})
export class TableUnitComponent implements OnInit, AfterViewInit {
  private dataSubscription = new Subscription();
  @Output() triggerRefresh = new EventEmitter();

  allUnits = [];
  filter = '';
  newDescription = ' ';
  currentlyBeingEditedUnitId: number;
  creating = false;
  columns = ['name', 'description', 'actions'];
  unitData = new MatTableDataSource<UnitsInterface>();

  defaultValuesForNewUnit: UnitsInterface;
  newUnitValues: UnitsInterface;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private unitService: UnitService, private snackBar: MatSnackBar, public tableService: TableService) {}

  ngOnInit() {
    this.defaultValuesForNewUnit = {
      unitId: null,
      name: '',
      description: '',
      currentlyBeingEdited: false,
    };
    this.loadUnits();
  }

  loadUnits() {
    this.unitService.getAllUnits().subscribe((units) => {
      this.allUnits = units;
      this.refreshData();
    });
  }

  refreshData() {
    if (this.allUnits) {
      this.unitData.data = this.allUnits.map((element) => {
        const newFormat: UnitsInterface = {
          unitId: element.unitId,
          name: element.unitName,
          description: element.description,
          currentlyBeingEdited: false,
        };
        return newFormat;
      });
    }
  }

  ngAfterViewInit() {
    this.unitData.paginator = this.paginator;
    this.unitData.paginator.firstPage();
    this.unitData.sort = this.sort;
  }

  newUnit() {
    this.newUnitValues = { ...this.defaultValuesForNewUnit };
    this.creating = true;
  }

  setNewDescription(description: string) {
    this.newDescription = description;
  }

  editUnitDescription(unit: UnitsInterface) {
    const lastEditedUnit = this.unitData.data.filter((unit) => unit.unitId === this.currentlyBeingEditedUnitId);
    if (lastEditedUnit.length === 1) {
      lastEditedUnit[0].currentlyBeingEdited = false;
    }
    unit.currentlyBeingEdited = true;
    this.currentlyBeingEditedUnitId = unit.unitId;
  }

  saveUnitDescription(unit: UnitsInterface) {
    unit.currentlyBeingEdited = false;
    this.currentlyBeingEditedUnitId = undefined;
    try {
      let updateSubscription;
      updateSubscription = this.unitService.updateUnit(unit.unitId, this.newDescription).subscribe(() => {
        this.snackBar.open('Unit Updated successfully', '', { duration: 2000 });
        this.loadUnits();
        this.newDescription = ' ';
      });
      this.dataSubscription.add(updateSubscription);
    } catch {
      this.snackBar.open('Unit Update was unsuccessful.', '', { duration: 2000 });
    }
  }

  cancelUnitDescription(unit: UnitsInterface) {
    unit.currentlyBeingEdited = false;
    this.currentlyBeingEditedUnitId = undefined;
  }

  applyFilter(filterValue: string) {
    this.unitData.filter = filterValue.trim().toLowerCase();
    if (this.unitData.paginator) {
      this.unitData.paginator.firstPage();
    }
  }

  cancelCreate() {
    this.creating = false;
  }

  deleteUnit(unit:UnitsInterface) {
    const deleteSubscription = this.unitService.deleteUnit(unit.unitId).subscribe(() => {
      this.snackBar.open('Unit deleted successfully', '', { duration: 2000 });
      this.loadUnits();
    });
    this.dataSubscription.add(deleteSubscription);
  }

  createUnit(newUnit: UnitsInterface) {
    try {
      const createSubscription = this.unitService.createUnit(newUnit).subscribe(() => {
        this.snackBar.open('Unit Created successfully', '', { duration: 2000 });
        this.loadUnits();
      });
      this.creating = false;
      this.dataSubscription.add(createSubscription);
    } catch {
      this.snackBar.open('Unit Creation was unsuccessful.', '', { duration: 2000 });
    }
  }
}

export interface UnitsInterface {
  unitId: number;
  name: string;
  description: string;
  currentlyBeingEdited: boolean;
}
