import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-multi-select-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatIconModule,
    DragDropModule
  ],
  templateUrl: './multi-select-input.component.html',
  styleUrls: ['./multi-select-input.component.css', '../../shared.css']
})
export class MultiSelectInputComponent<T> {
  @Input() label: string;
  @Input() displayKey: string;
  @Input() options: T[] = [];
  @Input() initialSelection: T[] = [];
  @Output() selectionChange = new EventEmitter<T[]>();
  
  @ViewChild(MatAutocompleteTrigger) autocomplete!: MatAutocompleteTrigger;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchControl = new FormControl<string>('');
  filteredOptions: T[] = [];
  selectedOptions: T[] = [];

  ngOnInit(): void {
    this.filteredOptions = [...this.options];
    this.selectedOptions = this.initialSelection ? [...this.initialSelection] : [];
    this.searchControl.valueChanges.subscribe((searchText) => {
      this.filteredOptions = this.options.filter((option) =>
        option[this.displayKey].toLowerCase().includes(searchText.toLowerCase()),
      );
    });
  }

  ngAfterViewInit(): void {
    this.updateAutocompletePanel();
  }

  updateAutocompletePanel(): void {
    if (this.selectedOptions.length > 0) {
      this.autocomplete.openPanel();
    } else {
      this.autocomplete.closePanel();
    }
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const option = this.options.find((option) => option[this.displayKey] === event.option.value);
    this.selectedOptions.push(option);
    this.selectionChange.emit(this.selectedOptions);
    this.clearSearchInput();
    this.updateAutocompletePanel();
  }

  removeOption(option: T): void {
    const selectedOptionIndex = this.selectedOptions.findIndex((selectedOption) => this.equalByDisplayKey(selectedOption, option));
    this.selectedOptions = this.selectedOptions.filter(
      (_, index) => index !== selectedOptionIndex
    );
    this.selectionChange.emit(this.selectedOptions);
  }

  isSelected(option: T): boolean {
    return this.selectedOptions.some((selectedOption) => this.equalByDisplayKey(selectedOption, option));
  }

  private equalByDisplayKey(option1: T, option2: T): boolean {
    return option1[this.displayKey] === option2[this.displayKey];
  }

  onChipDrop(event: CdkDragDrop<T[]>): void {
    moveItemInArray(this.selectedOptions, event.previousIndex, event.currentIndex);
    this.selectionChange.emit(this.selectedOptions);
  }

  resetSelection(initialSelection: T[]): void {
    this.selectedOptions = initialSelection ? [...initialSelection] : [];
    this.updateAutocompletePanel();
  }

  private clearSearchInput(): void {
    this.searchControl.setValue('');
    this.searchInput.nativeElement.value = '';
  }

}
