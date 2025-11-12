import { AfterViewInit, Component, effect, input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardContractRecommendation } from '@the-hive/lib-reviews-shared';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';

export type DashboardContractsListTableColumn = 'displayName' | 'department'  | 'nextReviewDate' | 'reviewer' | 'hrRep' | 'updatedAt';

@Component({
  selector: 'app-dashboard-contracts-list',
  imports: [CommonModule, MatTable, MatTableModule, MatSortModule],
  templateUrl: './dashboard-contracts-list.html',
  styleUrl: './dashboard-contracts-list.css'
})
export class DashboardContractsListComponent implements OnChanges, AfterViewInit {
  displayedColumns = input<DashboardContractsListTableColumn[]>();
  dashboardContractsList = input<DashboardContractRecommendation[]>();
  dashboardContractsListDataSource: MatTableDataSource<DashboardContractRecommendation> = new MatTableDataSource<DashboardContractRecommendation>();
  @ViewChild(MatSort) set sort(sort: MatSort) {
    if (this.dashboardContractsListDataSource) {
      this.dashboardContractsListDataSource.sort = sort;
    } else {
      // dashboardContractsListDataSource is undefined, so sort cannot be set
    }
  }
  get sort(): MatSort {
    return this.dashboardContractsListDataSource ? this.dashboardContractsListDataSource.sort : undefined;
  }
  get numberOfColumns(): number {
    return this.displayedColumns().length;
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['dashboardContractsList']) {
      this.dashboardContractsListDataSource.data = this.dashboardContractsList();
    } else {
      // We are not interested in handling other change events. We are only interested in the dashboardContractsList at the moment
    }
  }

  ngAfterViewInit(): void {
    this.dashboardContractsListDataSource.sort = this.sort;
  }
}
