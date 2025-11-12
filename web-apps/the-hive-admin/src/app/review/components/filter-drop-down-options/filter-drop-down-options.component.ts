import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

@Component({
    selector: 'app-filter-drop-down-options',
    templateUrl: './filter-drop-down-options.component.html',
    styleUrls: ['../../tabs/reviews/reviews.tab.css'],
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule
    ]
})
export class FilterDropDownOptionsComponent {
  @Input() control: FormControl;
  @Input() options: ({ id: number } & ({ description: string } | { name: string }))[];
  @Input() label: string;
  @Input() displayProperty = 'description';
  @Output() blurEvent = new EventEmitter<void>();

  onClosed() {
    this.blurEvent.emit();
  }

}