import { Component, signal, viewChild, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ContractsSearchBarComponent } from '../../components/contracts-search-bar/contracts-search-bar.component';
import { ContractReviewListComponent } from '../../components/contract-review-list/contract-review-list.component';
import { ChangeStaffToContractorComponent } from '../../../review/components/change-staff-to-contractor/change-staff-to-contractor.component';
import { MakeContractorsPermanentComponent } from '../../components/make-contractors-permanent-dialog/make-contractors-permanent.component';
import { contractAndRecommendationStatuses, ContractRecommendationCounts, ContractsAndContractRecommendationsFilterParameters, ContractsService } from '../../services/contracts.service';
import {MatBadgeModule} from '@angular/material/badge';
import { ContractRecommendation } from '@the-hive/lib-reviews-shared';

@Component({
    selector: 'app-contracts-to-do',
    templateUrl: './to-do.tab.html',
    imports: [
        ContractsSearchBarComponent,
        ContractReviewListComponent,
        ChangeStaffToContractorComponent,
        MakeContractorsPermanentComponent,
        MatBadgeModule,
    ],
    styleUrls: ['./to-do.tab.css', '../../../review/styles/reviewShared.css']
})
export class ContractsToDoComponent {

  readonly navOptions = contractAndRecommendationStatuses;

  activeNavOption = 'Upcoming Contracts';
  currentFilters$: BehaviorSubject<ContractsAndContractRecommendationsFilterParameters> = new BehaviorSubject({ status: this.activeNavOption});
  @ViewChild(ContractReviewListComponent) contractReviewList: ContractReviewListComponent;
  selectedRecommendation = signal<ContractRecommendation>(undefined);
  contractReviewListComponet = viewChild.required<ContractReviewListComponent>('contractReviewListComponent')
  contractRecommendationNumbers = signal<ContractRecommendationCounts>({});

  constructor(private contractsService: ContractsService) {}

  onSearchBarFiltersChanged(searchBarFilters: ContractsAndContractRecommendationsFilterParameters) {
    searchBarFilters.status = this.activeNavOption;
    this.selectedRecommendation.set(undefined);
    this.currentFilters$.next({
      ...this.currentFilters$.value,
      ...searchBarFilters,
    });
  }

  setActiveNavOption(navOption: string) {
    this.activeNavOption = navOption;
    this.selectedRecommendation.set(undefined);
    this.currentFilters$.next({
      ...this.currentFilters$.value,
      status: this.activeNavOption
    });
  }

  createAllRecommendations() {
    this.contractReviewList.createAllRecommendations()
  }

  refreshContractReviewListComponentData() {
    this.selectedRecommendation.set(undefined);
    this.contractReviewListComponet().fetchContractAndContractRecommendations();
  }

  fetchRecommendationNumbers(searchBarFilters : ContractsAndContractRecommendationsFilterParameters) {
    this.contractsService.getContractRecommendationNumbers(searchBarFilters).subscribe(this.contractRecommendationNumbers.set);
  }
}
