import { MatRadioModule } from '@angular/material/radio';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule} from '@angular/material/input';
import { OperatorSelectComponent } from '../operator-select/operator-select.component';
import { FieldFilter } from '../../../services/skills-search.types';
import { createFieldFilterForRange, createFieldFilter, rangeOperator } from '../../../services/skills-searchQuery.service';
import { FieldTypes } from '@the-hive/lib-skills-shared';

@Component({
    selector: 'skills-search-radio-button',
    templateUrl: 'skills-search-radio-button.component.html',
    styleUrl: 'skills-search-radio-button.component.css',
    imports: [MatRadioModule,
        FormsModule,
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        OperatorSelectComponent]
})
export class SkillsSearchRadioButtonComponent {
    @Input() buttonValues: string[] = [];
    @Input() name = '';
    @Input() fieldName: string;
    @Input() labelName: string;
    @Input() attributeType: string;
    @Input() fieldFormatter: FieldTypes;
    @Output() valueChange = new EventEmitter<FieldFilter>();

    inputSelected: FormControl = new FormControl(undefined, Validators.required);
    inputSelectedMin: FormControl = new FormControl(undefined, Validators.required);
    inputSelectedMax: FormControl = new FormControl(undefined, Validators.required);
    minValue: string;
    maxValue: string;
    errorMessage = signal(undefined);
    operator: string = undefined;
    range = false;

    constructor() {
        this.inputSelected.valueChanges.subscribe(() =>{
            this.onOptionSelected();
        });

        this.inputSelectedMin.valueChanges.subscribe(() => {
            this.minValue = this.inputSelectedMin.value;
            this.onOptionSelected();
        });

        this.inputSelectedMax.valueChanges.subscribe(() => {
            this.maxValue = this.inputSelectedMax.value;
            this.onOptionSelected();
        });
    }

    onOptionSelected(): void  {
        this.handleErrors();
        if(this.range){
            if(this.inputSelectedMin.value !== null && this.inputSelectedMax.value !== null) {
                if(this.errorMessage() === undefined){
                    const retrieveScaleRatingMin = this.fieldFormatter.parse(this.minValue)
                    const retrieveScaleRatingMax = this.fieldFormatter.parse(this.maxValue)
                    const rangeObject = createFieldFilterForRange(this.fieldName, this.fieldFormatter.toGremlin(retrieveScaleRatingMin), this.fieldFormatter.toGremlin(retrieveScaleRatingMax))
                    this.valueChange.emit(rangeObject);
                }else{
                    //there is an error so we don't emit the value
                }
            }else {
                //range hasn't been completed so we don't emit the value
            }
        }else{
            if(this.errorMessage() === undefined){
                const selectedValue = this.inputSelected.value;
                const retrieveScaleRating = this.fieldFormatter.parse(selectedValue)
                const attributeParameters = createFieldFilter(this.fieldName, {[this.operator]: this.fieldFormatter.toGremlin(retrieveScaleRating) });
                this.valueChange.emit(attributeParameters);
            }else{
                //there is an error so we don't emit the value
            }
        }
    }

    onOperatorSelected(operator: string){
        this.operator = operator;
        this.errorMessage.set(undefined);
        if(this.operator === rangeOperator){
            this.range = true;
        }else{
            this.range = false
        }

        if(this.inputSelected.value != undefined || this.inputSelectedMin.value != null && this.inputSelectedMax.value != null){
            this.onOptionSelected();
        }else{
            //we do nothing because there is no selected value
        }
    }

    handleErrors(){
        if(this.operator == undefined){
            this.errorMessage.set(`Please select a Parameter Type`);
        }else{
            if(this.range){
                if(this.buttonValues.indexOf(this.minValue) > this.buttonValues.indexOf(this.maxValue)){
                    this.errorMessage.set(`Minimum needs to be lower than the maximum`);
                }else if(this.buttonValues.indexOf(this.minValue) == this.buttonValues.indexOf(this.maxValue)){
                    this.errorMessage.set(`Please select a valid range`);
                }else{
                    this.errorMessage.set(undefined);
                }
            }
        }

    }

}
