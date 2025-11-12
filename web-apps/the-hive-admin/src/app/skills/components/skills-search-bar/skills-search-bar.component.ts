import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AttributeForSearchTextException, AttributeType, CanonicalNameDetails } from '@the-hive/lib-skills-shared';
import { findAttributesForSearchTextException } from '@the-hive/lib-skills-web';
import { combineLatest, debounceTime, map, of, shareReplay, startWith, switchMap } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { EnvironmentService } from '../../../services/environment.service';
import { SkillsService } from '../../services/skills.service';

@Component({
  selector: 'app-skills-search-bar',
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
  templateUrl: './skills-search-bar.component.html',
  styleUrls: ['./skills-search-bar.component.css']
})
export class SkillsSearchBarComponent implements OnInit {
  searchControl = new FormControl<string>('',{
    updateOn: 'change'
  });
  searchTextExceptions$: Observable<AttributeForSearchTextException[]>;
  minimumSearchCharacters: number;
  searchResults: CanonicalNameDetails[];
  @Output() searchOptionSelected = new EventEmitter<CanonicalNameDetails>();
  @Input () attributeType$: Observable<AttributeType | 'all'> = of('all');

  constructor(private readonly skillsService: SkillsService, private readonly environmentService: EnvironmentService){
    this.minimumSearchCharacters = this.environmentService.getConfiguratonValues().SKILL_MIN_SEARCH_CHARACTERS;
  }

  ngOnInit() {
    this.retrieveSkillSearchTextExceptions();
    combineLatest([
      this.searchControl.valueChanges.pipe(
        startWith(""),
        debounceTime(500)
      ),
      this.searchTextExceptions$,
      this.attributeType$.pipe(
        startWith(undefined),
        map(attributeType => attributeType === 'all' ? undefined : attributeType)),
    ]).pipe(
      switchMap(([searchText, searchTextExceptions, attributeType]) => {
        this.searchResults = undefined;
        return this.retrieveSkillSearchResults(searchText, searchTextExceptions, attributeType);
      })
    ).subscribe((results) => {
      this.searchControl.markAsTouched();
      this.searchResults = results ?? [];
      if (results && results.length === 0) {
        this.searchControl.setErrors({ noResults: true });
      } else {
        // The search returned results, no need to show error
      }
    });
  }

  retrieveSkillSearchResults(searchText: string, searchTextExceptions: AttributeForSearchTextException[], attributeType: AttributeType): Observable<CanonicalNameDetails[] | undefined> {
    if (!searchText || searchText.trim().length === 0) {
      return of(undefined);
    } else {
      this.searchControl.setErrors(undefined);
      const isSearchTextValidLength = searchText.trim().length >= this.minimumSearchCharacters;
      const matchingSearchTextExceptions = findAttributesForSearchTextException(searchTextExceptions, searchText);
      if(searchText && matchingSearchTextExceptions.length > 0 && !isSearchTextValidLength){
        return of(matchingSearchTextExceptions.map((searchTextException) => {
          return {
            canonicalName: searchTextException.canonicalName,
            standardizedName: searchTextException.standardizedName,
            canonicalNameId: searchTextException.canonicalNameId,
            canonicalNameCategoryId: searchTextException.canonicalNameCategoryId,
            canonicalNameGuid: searchTextException.canonicalNameGuid
          }
        }));
      } else if (searchText && isSearchTextValidLength) {
        return this.skillsService.getAttributeSearchResults(searchText, attributeType);
      } else {
        this.searchControl.setErrors({ minLength: true });
        return of(undefined);
      }
    }
  }

  retrieveSkillSearchTextExceptions(){
    this.searchTextExceptions$ = this.skillsService.retrieveSearchTextExceptions().pipe(shareReplay(1));
  }

  onSearchOptionSelected(event: MatAutocompleteSelectedEvent) {
    this.searchOptionSelected.emit(event.option.value);
    this.searchControl.setValue("");
  }
}
