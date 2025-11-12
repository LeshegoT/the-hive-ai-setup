import { CdkAccordionModule } from "@angular/cdk/accordion";
import { Component, Input, Output } from "@angular/core";
import { EventEmitter } from "@angular/core";
import { MatCheckbox } from "@angular/material/checkbox";

@Component({
    selector: 'app-preview-cv-attribute',
    templateUrl: './preview-cv-attributes.component.html',
    standalone: true,
    imports: [
        CdkAccordionModule,
        MatCheckbox
    ],
    styleUrls: ['./preview-cv-attributes.component.css']
})

export class PreviewCvAttributeComponent<T>  {
    @Input() list: T[];
    @Input() displayProperty: string;
    @Input() header: string;
    @Output() selectedItems = new EventEmitter<T[]>();
    private itemsToEmit:T[];
    constructor() {
        this.itemsToEmit = [];
    }

    update(checked: boolean, index: number): void {
        if (checked) {
            this.itemsToEmit.push(this.list[index])
        } else {
            const itemToRemove = this.list[index];
            let indexToSplice = 0;
            this.itemsToEmit.forEach((element, itemsToEmitIndex) => {
                if (element === itemToRemove){
                    indexToSplice = itemsToEmitIndex;
                } else {
                    // Don't remove checked attributes
                }            
            });
            if (this.itemsToEmit.length !== 0) {
                this.itemsToEmit.splice(indexToSplice,1);
            } else {
                // Don't remove anything
            }
        }
        this.selectedItems.emit([...this.itemsToEmit]);
  }
}
