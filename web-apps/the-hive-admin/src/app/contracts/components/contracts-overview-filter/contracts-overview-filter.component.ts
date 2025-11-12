import { Component, computed, signal, viewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UnitFilterComponent } from '../../../components/unit-filter/unit-filter.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { StaffFilterComponent } from '../../../components/staff-filter/staff-filter.component';
import { Person } from '../../../shared/interfaces';
import { StaffProfileComponent } from '../../../components/staff-profile/staff-profile.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FilterParameters } from '../../services/contracts-overview.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectCompanyEntities } from '../../../components/select-company-entity/select-company-entity.component'
import { CompanyEntity } from '../../../services/company-entities.service';


@Component({
    selector: 'contracts-overview-filter',
    templateUrl: './contracts-overview-filter.component.html',
    styleUrls: ['./contracts-overview-filter.component.css', '../../../review/styles/reviewShared.css'],
    imports: [
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        UnitFilterComponent,
        MatIconModule,
        MatButtonModule,
        StaffFilterComponent,
        StaffProfileComponent,
        MatTooltipModule,
        MatChipsModule,
        MatIconModule,
        MatCheckboxModule,
        SelectCompanyEntities
    ]
})
export class ContractOverviewFilter {
    public searchText = signal<string>(undefined);
    public unit = computed<string[] | undefined>(()=> this.unitFilterComponent().selectedUnitList());
    public filterParameters = computed<FilterParameters>(() => { return {searchText: this.searchText(), selectedUnits: this.unit(), onlyContractorsWithNoContracts: this.onlyContractorsWithNoContracts(), selectedEntities: this.selectedEntities() }} );
    public unitFilterComponent =  viewChild.required<UnitFilterComponent>('unitFilter');
    public staffFilterComponent = viewChild.required<StaffFilterComponent>('staffFilter')
    public onlyContractorsWithNoContracts = signal<boolean>(false);
    public selectedEntities = signal<number[]>(undefined);
    selectedStaffMember: Person = undefined;
    
    public clearUnitFilter() {
        this.unitFilterComponent().selectedUnitList.set(undefined);
        this.unitFilterComponent().unitSearchInputText.setValue('');
    }

    public staffSearch() {
        this.selectedStaffMember  = this.staffFilterComponent().selectedUserPrinciple;
        this.searchText.set(this.selectedStaffMember.userPrincipleName);
    }

    public clearStaffFilter() {
        this.searchText.set(undefined);
        this.staffFilterComponent().clearField(undefined);
        this.selectedStaffMember = undefined;
    }


    onEntitySelection(entities: CompanyEntity[]) {
        this.selectedEntities.set(entities.map((entity: CompanyEntity)=> entity.companyEntityId));
        
    }
}
