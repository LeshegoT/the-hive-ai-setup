import { ChangeDetectionStrategy, Component, signal, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FieldFilter } from '../../../services/skills-search.types';
import { OperatorSelectComponent } from '../operator-select/operator-select.component'
import { createFieldFilterForRange, createFieldFilter, rangeOperator } from '../../../services/skills-searchQuery.service';

@Component({
    selector: 'skills-search-number-input',
    templateUrl: './skills-search-number-input.component.html',
    styleUrls: ['./skills-search-number-input.component.css'],
    imports: [MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, OperatorSelectComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsSearchNumberInputComponent {
    @Input() name: string;
    @Input() labelName: string;
    @Input() fieldName: string;
    @Input() attributeType: string;
    @Input() disabled = false;
    @Input() placeholder?: string;
    @Input() value: number = undefined;
    @Input() max = 100;
    @Input() min = 0;
    @Output() valueChange = new EventEmitter<FieldFilter>();

    numberControl: FormControl = new FormControl(this.value, Validators.required);
    numberControlMinValue: FormControl = new FormControl(this.value, Validators.required);
    numberControlMaxValue: FormControl = new FormControl(this.value, Validators.required);
    operator: string;
    errorMessage = signal(undefined);
    range = false; 

    constructor() {
        this.numberControl.valueChanges.subscribe(() => {
            this.onInputChange();
        });

        this.numberControlMinValue.valueChanges.subscribe(() =>{
            this.onInputChange();
        });

        this.numberControlMaxValue.valueChanges.subscribe(() =>{
            this.onInputChange();
        });
    }

    onInputChange() {
        this.validateInput();
        if(this.range) {
            if(this.numberControlMinValue.value != null && this.numberControlMaxValue.value != null){
                if(this.errorMessage() === undefined){
                    const minInputValue = Number(this.numberControlMinValue.value);
                    const maxInputValue = Number(this.numberControlMaxValue.value);
                    this.valueChange.emit(createFieldFilterForRange(this.fieldName, minInputValue, maxInputValue));
                }else{
                   //do nothing as there is an error 
                }
            }else{
                //the range isn't complete
            }
            
        } else {
            if(this.errorMessage() === undefined){
                if(!isNaN(this.numberControl.value) || this.numberControl.value > this.min || this.numberControl.value < this.max) {
                    const inputValue =  Number(this.numberControl.value);
                    const fieldObject = createFieldFilter(this.fieldName, { [this.operator]: inputValue});
                    this.valueChange.emit(fieldObject); 
                }else{
                    //do nothing as the number inputted is not valid 
                }
            }else{
                //do nothing as there is an error
            }
            
            
        }
    }

    validateInput(){
        if(this.operator === undefined){
            this.errorMessage.set('Please select an operator');
        }else{
            this.errorMessage.set(undefined);
            if(this.range){
                const minInputValue = Number(this.numberControlMinValue.value);
                const maxInputValue = Number(this.numberControlMaxValue.value);
                
                if(minInputValue < this.min || maxInputValue > this.max){
                    this.errorMessage.set(`Minimum needs to be greater than or equal to ${this.min} & maximum needs to be less than or equal to ${this.max}`);
                }else if(minInputValue > this.max || maxInputValue < this.min){
                    this.errorMessage.set(`Minimum needs to be less than ${this.max} & maximum needs to be greater than ${this.min}`);
                }else if(maxInputValue <= minInputValue){
                    this.errorMessage.set('Maximum needs to be greater than minimum');
                }else if(minInputValue === undefined){
                    this.errorMessage.set('Please provide a minimum value for the range');
                }else if(maxInputValue === undefined){
                    this.errorMessage.set('Please provide a maximum value for the range');
                }else{
                    this.errorMessage.set(undefined);
                }
               
            }else{
                if(this.numberControl.value < this.min){
                    this.errorMessage.set(`Please input a value bigger than ${this.min}.`);
                }else if(this.numberControl.value >= this.max){
                    this.errorMessage.set(`Please input a value smaller than ${this.max}.`);
                }else{
                    this.errorMessage.set(undefined); 
                }
            }
        }
    }

    handleKeyDown(event: KeyboardEvent) {
        const allowedKeys = /^[0-9.]$/;
        const navigationKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'];

        if (allowedKeys.test(event.key) || navigationKeys.includes(event.key)) {
            this.validateInput(); 
        } else {
            event.preventDefault();
            this.errorMessage.set(event.key === ',' ? 'Please use dots for decimals, e.g., 0.25' : '');
        }
    }

    onOperatorSelected(operator: string){
        this.operator = operator;
        this.errorMessage.set(undefined);
        if(this.operator == rangeOperator){
            this.range = true;
        }else{
            this.range = false;
        }

        if(this.numberControl.value !== undefined || this.numberControlMinValue.value !== null || this.numberControlMaxValue.value !== null){
            this.onInputChange();
        }else{
            //we do nothing because there is no selected value 
        }
    }
}


