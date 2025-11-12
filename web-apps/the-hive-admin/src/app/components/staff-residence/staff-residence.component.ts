import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { StaffResidenceService } from '../../staff/services/staff-residence-service';

export interface ResidenceSuggestions {
  type: string;
  entityType: string;
  address: ResidenceSuggestionsAddress
}

interface ResidenceSuggestionsAddress {
  municipality: string;
  countrySubdivision: string;
  country: string;
}

@Component({
  selector: 'app-residence-input',
  templateUrl: './staff-residence.component.html',
  styleUrls: ['./staff-residence.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule
  ]
})
export class StaffResidenceComponent implements OnInit {
   @Output() residenceSelected = new EventEmitter<string>();

  residenceControl = new FormControl('');
  suggestions: ResidenceSuggestions[];
  private subscriptionKey: string;

  constructor(private staffResidenceService: StaffResidenceService) {
  }

  ngOnInit() {
    this.residenceControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.fetchSuggestions(query))
    ).subscribe(results => this.suggestions = results);
  }

    private fetchSuggestions(query: string) {
    if (!query || query.length < 2) {
      return of<ResidenceSuggestions[]>([]);
    }

    return this.staffResidenceService.getResidenceSuggestions(query);
  }

  selectSuggestion(suggestion: ResidenceSuggestions) {

    const city = suggestion.address.municipality || suggestion.address.countrySubdivision || '';
    const country = suggestion.address.country || '';
    const displayValue = city ? `${city}, ${country}` : country;

    this.residenceControl.setValue(displayValue, { emitEvent: false });
    this.suggestions = [];
    this.residenceSelected.emit(displayValue);
  }
}