import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractsRoutingModule } from './contracts-routing.module';
import { Contracts } from './pages/contracts/contracts.page';
import { ContractsDashboardService } from './services/contracts-dashboard.service';
import { ContractsOverviewComponent } from './tabs/contracts-overview/contracts-overview.tab';
import { SharedModule } from '../shared.modules';
import { ContractsToDoComponent } from './tabs/todo-tab/to-do.tab';
import { DashboardComponent } from './tabs/dashboard/dashboard.page';
import { DashboardFilterComponent } from '../review/components/dashboard-filter/dashboard-filter.component';
import { ReviewDashboardServiceToken } from '../shared/reviews-dashboard-service-token';
import { ReviewStatusSummaryTableComponent } from '../review/components/review-status-summary-table/review-status-summary-table.component';
import { DashboardContractsListComponent } from './components/dashboard-contracts-list/dashboard-contracts-list';


@NgModule({
  declarations: [
    Contracts,
    DashboardComponent,
  ],
  imports: [
    CommonModule,
    ContractsRoutingModule,
    ContractsOverviewComponent,
    ContractsToDoComponent,
    SharedModule,
    DashboardFilterComponent,
    ReviewStatusSummaryTableComponent,
    DashboardContractsListComponent
  ],
  providers: [
    {
      provide: ReviewDashboardServiceToken,
      useClass: ContractsDashboardService
    }
  ]
})
export class ContractsModule { }
