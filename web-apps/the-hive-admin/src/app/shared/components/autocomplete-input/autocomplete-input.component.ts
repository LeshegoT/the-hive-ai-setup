import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { EnvironmentService } from '../../../services/environment.service';

@Component({
  selector: 'app-autocomplete-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatIcon, MatIconModule, MatTooltipModule],
  templateUrl: './autocomplete-input.component.html',
  styleUrls: ['./autocomplete-input.component.css']
})
export class AutocompleteInputComponent implements OnInit, OnDestroy {
  @Input() label: string;
  @Input() options: string[] = [];
  @Input() requiredFieldErrorMessage: string;
  @Input() minimumLengthErrorMessage: string;
  @Input() showAddNewOption = true;
  @Input() searchTextControl: FormControl = new FormControl('');
  @Output() addNewOption = new EventEmitter<string>();
  filteredOptions: string[] = [];

  minimumLength: number;

  constructor(private readonly environmentService: EnvironmentService) {
    this.minimumLength = this.environmentService.getConfiguratonValues().SKILL_MIN_SEARCH_CHARACTERS;
  }

  private searchTextSubscription: Subscription;
  private isPanelOpen = false;
  matcher: ErrorStateMatcher = {
    isErrorState: (): boolean => {
      return this.shouldShowErrors();
    }
  };

  ngOnInit(): void {
    this.filterOptions(this.searchTextControl.value);
    this.searchTextSubscription = this.searchTextControl.valueChanges.subscribe((value) => {
      this.filterOptions(value);
      this.searchTextControl.markAsTouched();
    });
  }

  filterOptions(value: string) {
    if (value) {
      this.filteredOptions = this.options.filter((option) =>
        option.toLowerCase().includes(value.toLowerCase())
      );
    } else {
      this.filteredOptions = this.options;
    }
  }

  optionSelectedHandler(event: MatAutocompleteSelectedEvent) {
    this.searchTextControl.setValue(event.option.value);
  }

  shouldShowErrors(): boolean {
    if (this.isPanelOpen) {
      return false;
    } else {
      return !!(this.searchTextControl && this.searchTextControl.invalid && this.searchTextControl.touched);
    }
  }

  onPanelOpened() {
    this.isPanelOpen = true;
  }

  onPanelClosed() {
    this.isPanelOpen = false;
  }

  onAddNewOption() {
    this.addNewOption.emit(this.searchTextControl.value);
  }

  optionExists(option: string): boolean {
    return this.options.some((optionToCompare) => optionToCompare === option);
  }

  ngOnDestroy(): void {
    if (this.searchTextSubscription) {
      this.searchTextSubscription.unsubscribe();
    } else {
      // The subscription was unset, don't unsubscribe.
    }
  }
}
