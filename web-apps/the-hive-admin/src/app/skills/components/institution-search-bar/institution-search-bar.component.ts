import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Institution } from '@the-hive/lib-skills-shared';
import { SkillsService } from '../../services/skills.service';
import { debounceTime, of, startWith, switchMap } from 'rxjs';
import { EnvironmentService } from '../../../services/environment.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-institution-search-bar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatAutocompleteModule,
    MatError,
    MatProgressSpinnerModule,
  ],
  templateUrl: './institution-search-bar.component.html',
  styleUrls: ['./institution-search-bar.component.css']
})
export class InstitutionSearchBarComponent implements OnInit {
  searchControl = new FormControl<string>('');
  minimumSearchCharacters: number;
  institutionSearchResults: Institution[];
  @Output() searchOptionSelected = new EventEmitter<Institution>();

  constructor(private readonly skillsService: SkillsService, private readonly environmentService: EnvironmentService){
    this.minimumSearchCharacters = this.environmentService.getConfiguratonValues().SKILL_MIN_SEARCH_CHARACTERS;
  }

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      startWith(""),
      debounceTime(500),
      switchMap((searchText) => {
        this.institutionSearchResults = undefined;
        this.searchControl.setErrors(undefined);
        searchText = searchText.trim();
        if (!searchText || searchText.length === 0) {
          return of(undefined);
        } else if (searchText.length < this.minimumSearchCharacters) {
          this.searchControl.setErrors({ minLength: true });
          return of(undefined);
        } else {
          return this.skillsService.retrieveInstitutions(searchText, true);
        }
      })
    ).subscribe((results) => {
      this.searchControl.markAsTouched();
      this.institutionSearchResults = results ?? [];
      if (results && results.length === 0) {
        this.searchControl.setErrors({ noResults: true });
      } else {
        // The search returned results, no need to show error
      }
    });
  }

  onSearchOptionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedInstitution = this.institutionSearchResults.find(option => option.canonicalName === event.option.value);
    this.searchOptionSelected.emit(selectedInstitution);
  }
}