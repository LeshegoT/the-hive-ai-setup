import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { FieldFilter } from '../../../services/skills-search.types'
import { createFieldFilter, defaultOperator, institutionOperatorValue } from '../../../services/skills-searchQuery.service';
import { SkillsService } from '../../../services/skills.service'
import { FieldTypes } from '@the-hive/lib-skills-shared';
@Component({
    selector: 'skills-search-drop-down',
    templateUrl: './skills-search-drop-down.component.html',
    styleUrls: ['./skills-search-drop-down.component.css'],
    imports: [MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule, CommonModule, ReactiveFormsModule]
})
export class SkillsSearchDropDownComponent {
    @Input() dropDownValues: string[] = [];
    @Input() labelName = '';
    @Input() fieldName = '';
    @Input() index = true;
    @Input() multiSelect = false;
    @Input() fieldFormatter: FieldTypes;
    @Output() valueChange = new EventEmitter<FieldFilter>();

    inputSelected: FormControl<string | number> = new FormControl();

    constructor(private readonly skillsService: SkillsService) {
      this.inputSelected.valueChanges.subscribe((value) => {
        this.onOptionSelected(value);
      });
    }

    onOptionSelected(value: string | number): void {
      if(this.fieldName === this.skillsService.skillFieldNames.yearsOfExperienceRating.name){
        const retrieveScaleRating = this.fieldFormatter.parse(value)
        const fieldFilter = createFieldFilter(this.fieldName, {[defaultOperator]: this.fieldFormatter.toGremlin(retrieveScaleRating)})
        this.valueChange.emit(fieldFilter);
      }else if(this.fieldName === this.skillsService.skillFieldNames.obtainedFrom.name){
        const fieldFilter = createFieldFilter(this.fieldName, {[institutionOperatorValue]: value})
        this.valueChange.emit(fieldFilter);
      }else{
        const fieldFilter = createFieldFilter(this.fieldName, {[defaultOperator]: value})
        this.valueChange.emit(fieldFilter);
      }
    }
}
