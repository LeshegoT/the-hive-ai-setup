import { Component, effect, input, output, signal, untracked, ViewChild, viewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule, DatePipe } from '@angular/common';
import { TableService } from '../../../services/table.service';
import { ContractStaff, PageInformation } from '../../interfaces';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ContractOverviewsService, FilterParameters } from '../../services/contracts-overview.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSort, MatSortModule } from '@angular/material/sort';

type SelectedStaffActions = 'ShowContracts' | 'MakePermanent';

export interface ContractOverviewListSelectedStaff {
  staff: ContractStaff;
  action: SelectedStaffActions;
}

@Component({
    selector: 'contracts-overview-list',
    styleUrls: ['../../../../styles.css', 'contracts-overview-list.component.css'],
    templateUrl: 'contracts-overview-list.component.html',
    imports: [MatTableModule, DatePipe, MatPaginatorModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule, MatTooltip, CommonModule, MatSortModule]
})
export class ContractsOverviewList {
  readonly displayedColumns: (keyof ContractStaff  | 'hrReps' | 'actions')[] = ['displayName','reviewer','department', 'entity', 'office','employmentDate', 'hasActiveContractRecommendation','hrReps', 'actions'];
  public contractStaffDataSource = new MatTableDataSource<ContractStaff>([]);
  public filterParameters = input.required<FilterParameters>();
  public paginator = viewChild.required<MatPaginator>('paginator');
  public pageInfo = signal<PageInformation>({
    pageNumber: 0,
    pageSize: 10,
    totalPages: undefined,
    resultSetSize: undefined,
  });
  public selectedStaffAndAction = output<ContractOverviewListSelectedStaff>();
  private selectedRowId: string;
  private _matSort: MatSort;

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    this._matSort = sort;
    if (this.contractStaffDataSource) {
      this.contractStaffDataSource.sort = sort;
    } else {
      // contractStaffDataSource is undefined, so sort cannot be set
    }
  }

  get matSort(): MatSort {
    return this._matSort;
  }

  constructor(public tableService: TableService, private contractOverviewsService: ContractOverviewsService, public dialog: MatDialog) {
    effect(() => {
        untracked(() => this.resetPageNumber());
        this.loadContractStaffMembers(this.filterParameters(), untracked(() =>this.pageInfo()));  
    })
  }

  private loadContractStaffMembers(filterParameters: FilterParameters, pageInfo: PageInformation) {
    this.contractStaffDataSource = undefined;
    this.contractOverviewsService.getContractStaffMembers(filterParameters, pageInfo).subscribe({
      next: (contractStaffList: ContractStaff[]) => {
        this.contractStaffDataSource = new MatTableDataSource<ContractStaff>([]);
        this.updatePageInfo(contractStaffList);
        this.contractStaffDataSource.data = contractStaffList;
        this.contractStaffDataSource.sort = this.matSort;
      }
    })
  }

  public pageChanged(event: PageEvent) {
    this.pageInfo().pageSize = event.pageSize;
    this.pageInfo().pageNumber = event.pageIndex;
    this.loadContractStaffMembers(this.filterParameters(), this.pageInfo());
  }

  private resetPageNumber() {
    this.pageInfo().pageNumber = 0;
  }

  private updatePageInfo(contractStaffList: ContractStaff[]) {
    if (contractStaffList.length> 0) {
      const totalResultSet = contractStaffList[0].resultSetSize;
      this.pageInfo().resultSetSize = totalResultSet;
      this.pageInfo().totalPages = Math.ceil(totalResultSet / this.pageInfo().pageSize);
    } else {
      this.pageInfo().resultSetSize = undefined;
      this.pageInfo ().totalPages = undefined;
    }
    
  }
  
  emitStaffForPermanentRole(contractStaff: ContractStaff): void {
    this.selectedStaffAndAction.emit({
      staff: contractStaff,
      action: 'MakePermanent'
    });
  }

  isRowSelected(row: ContractStaff): boolean {
    return this.selectedRowId === row.staffId.toString();
  }

  setSelectedRow(row: ContractStaff): void {
    this.selectedRowId = row.staffId.toString();
  }

  showContractHistoryForStaff(contractStaff: ContractStaff): void {
    this.selectedStaffAndAction.emit({
      staff: contractStaff,
      action: 'ShowContracts'
    });    
  }

  refreshContractStaffData() {
    this.loadContractStaffMembers(this.filterParameters(), this.pageInfo());
  }
}
