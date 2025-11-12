import { Component, computed, signal, untracked, viewChild} from '@angular/core';
import { ContractOverviewListSelectedStaff, ContractsOverviewList } from '../../components/contract-overview-list/contracts-overview-list.component';
import { ContractStaff } from '../../interfaces';
import { ContractOverviewFilter } from '../../components/contracts-overview-filter/contracts-overview-filter.component';
import { MakeContractorsPermanentComponent } from "../../components/make-contractors-permanent-dialog/make-contractors-permanent.component";
import { CommonModule } from '@angular/common';
import { StaffContractListComponent } from '../../components/staff-contract-list/staff-contract-list.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FilterParameters } from '../../services/contracts-overview.service';

@Component({
    selector: 'app-contracts-overview',
    templateUrl: './contracts-overview.tab.html',
    styleUrls: ['./contracts-overview.tab.css'],
    imports: [
        ContractsOverviewList,
        ContractOverviewFilter,
        MakeContractorsPermanentComponent,
        StaffContractListComponent,
        MatButtonModule,
        MatIconModule,
        CommonModule
    ]
})
export class ContractsOverviewComponent {
    contractStaffData = signal<ContractStaff[]>([]);
    contractOverview = viewChild.required<ContractOverviewFilter>("filter");
    filterParameters = computed<FilterParameters>(() => {
      untracked(() => {
        this.clearSelectedStaffAndAction();
      });
      return this.contractOverview().filterParameters();
    });
    contractOverviewListComponent =  viewChild.required<ContractsOverviewList>('contractsOverviewList');
    selectedStaffAndAction = signal<ContractOverviewListSelectedStaff>(undefined);

    reloadContractStaffData(staffTypeChanged: boolean) { 
      this.selectedStaffAndAction.set(undefined);
      if(staffTypeChanged) {
        this.contractOverviewListComponent().refreshContractStaffData();
      } else{
        // Nothing happens when contract staff type was not changed.
      }
    }

    clearSelectedStaffAndAction() {
      this.selectedStaffAndAction.set(undefined);
    }
}
