import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { SkillsSearchQueryService } from '../../../services/skills-searchQuery.service';
import { MatSelectChange } from '@angular/material/select';
import { FilterSearchOption } from '../../../services/skills.service'
@Component({
    selector: 'skills-search-operator-selector',
    templateUrl: './operator-select.component.html',
    styleUrls: ['./operator-select.component.css'],
    imports: [MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule, CommonModule, ReactiveFormsModule]
})
export class OperatorSelectComponent implements OnInit {
    dropDownValues: FilterSearchOption[];
    @Input() disabled = false;
    @Input() attributeType = '';
    @Input() name = '';
    @Output() valueChange = new EventEmitter<string>();

    constructor(private skillsUtils: SkillsSearchQueryService){}
    inputSelected: FormControl<string> = new FormControl();

    async ngOnInit(){
      const searchFilterOptions = await this.skillsUtils.retrieveSkillsSearchFilters();
      this.filterSearchOptionsBasedOnJSType(searchFilterOptions);
    }

    filterSearchOptionsBasedOnJSType(dropDownValues: FilterSearchOption[]){
      this.dropDownValues = dropDownValues.filter(option => option.javaScriptType === this.attributeType);
    }

    onOptionSelected(option: MatSelectChange): void {
      const selectedOption = option.value
      this.valueChange.emit(selectedOption.skillSearchComparison);
    }
}
