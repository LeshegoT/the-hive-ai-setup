import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelect } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, map, startWith, switchMap, tap } from 'rxjs/operators';
import { EnvironmentService } from '../../../services/environment.service';
import { removePunctuation } from '../../../shared/remove-punctuation';
import { Alias, CanonicalName, CanonicalNameAndAlias, CanonicalNameAndAliasesData, CanonicalNameWithAliases, SkillsService } from '../../services/skills.service';
import { CanonicalNameAndAliasCardComponent } from '../canonical-name-and-alias-card/canonical-name-and-alias-card.component';
import { CanonicalNameCategory } from '@the-hive/lib-skills-shared';

@Component({
    selector: 'app-manage-alias',
    templateUrl: './manage-alias.component.html',
    styleUrls: ['./manage-alias.component.css'],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        CanonicalNameAndAliasCardComponent,
        MatSelect,
        MatCheckbox,
        MatPaginator,
    ]
})
export class ManageAliasComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  searchText: FormControl<string> = new FormControl('');
  canonicalNameCategoryControl: FormControl<{canonicalNameCategoryId: number, canonicalNameCategory: string}> = new FormControl(undefined, Validators.required);
  canonicalNameControl: FormControl;
  pageSize = new BehaviorSubject<number>(25);
  currentPage = new BehaviorSubject<number>(0);
  snackBarDuration: number;
  category : FormControl<string> = new FormControl(undefined);
  maxSearchResultLength = 50;
  defaultPageNumber  = 0;

  canonicalNameAndAliases: CanonicalNameWithAliases[] = [];

  filteredOptions: string[];
  canonicalNameCategories$: Observable<CanonicalNameCategory[]>;
  totalItems: number;

  findNotInGraphDB : FormControl<boolean> = new FormControl(false);

  constructor(
    private skillsService: SkillsService,
    private matSnackBar: MatSnackBar,
    private environmentService: EnvironmentService
  ) {}

  ngOnInit() {
    this.canonicalNameAndAliases = undefined;
    this.snackBarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
    this. canonicalNameCategories$ = this.skillsService.getCanonicalNameCategories();
    combineLatest({
      searchText: this.searchText.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        tap((searchText)=> this.setSearchAutoComplete(this.skillsService.getCanonicalNamesAndAliases(searchText, this.category.value, this.maxSearchResultLength, this.defaultPageNumber, this.findNotInGraphDB.value))),
        map((searchText) => {
          this.resetPagination();
          return searchText;
        })),
      pageSize: this.pageSize.asObservable().pipe(startWith(25)),
      currentPage: this.currentPage.asObservable().pipe(startWith(this.defaultPageNumber)),
      category: this.category.valueChanges.pipe(startWith(undefined)),
      findNotInGraphDB: this.findNotInGraphDB.valueChanges.pipe(
        startWith(false),
        map((findNotInGraphDB) => {
          this.resetPagination();
          return findNotInGraphDB;
        }),
      )
    })
    .pipe(
      switchMap(({searchText, pageSize, currentPage, category, findNotInGraphDB}) =>
        combineLatest({
          canonicalNameData: this.skillsService.getCanonicalNamesAndAliases(searchText, category, pageSize, currentPage, findNotInGraphDB),
          canonicalNameCategories: this.canonicalNameCategories$
        })),
      map(({canonicalNameData, canonicalNameCategories}) => {
        this.totalItems = canonicalNameData.total;
        return this.transformCanonicalNamesAndAliases(canonicalNameData.canonicalNamesAndAliases).map((canonicalName) => ({...canonicalName, canonicalNameCategory: canonicalNameCategories.find((canonicalNameCategory) => canonicalNameCategory.standardizedName === canonicalName.canonicalNameCategory).canonicalName}));
      })
    )
      .subscribe((canonicalNameData) => {
        this.canonicalNameAndAliases = canonicalNameData;
      });

  }

  resetPagination() {
    this.currentPage.next(this.defaultPageNumber);
    if (this.paginator) {
      this.paginator.firstPage();
    }
    else {
      // do nothing
    }
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.currentPage.next(event.pageIndex);
    this.pageSize.next(event.pageSize);
  }

  setSearchAutoComplete(results: Observable<CanonicalNameAndAliasesData>): void {
    results.subscribe({
      next: (value) => {
        this.filteredOptions = this.transformCanonicalNamesAndAliases(
          value.canonicalNamesAndAliases
        ).flatMap((canonicalName) => [
          canonicalName.canonicalName,
          ...canonicalName.aliases.map((aliasData) => aliasData.alias),
        ]);
      },
      error: (error) => {
        this.matSnackBar.open(error, 'Dismiss', {
          duration: this.snackBarDuration,
        });
      },
    });
  }

  transformCanonicalNamesAndAliases(canonicalNames: CanonicalNameAndAlias[]) {
    return canonicalNames.reduce((canonicalNamesAndAliases, {standardizedName, canonicalNamesId, canonicalName, canonicalNameCategory, aliasesId, alias, inGraphDB }) => {
      let existingCanonicalName = canonicalNamesAndAliases.find(
        (canonicalName) => canonicalName.canonicalNamesId === canonicalNamesId
      );

      if (!existingCanonicalName) {
        existingCanonicalName = {standardizedName, canonicalNamesId, canonicalName, canonicalNameCategory, aliases: [], inGraphDB };
        canonicalNamesAndAliases.push(existingCanonicalName);
      } else {
        //Canonical name exists so don't create a new one
      }

      if (aliasesId) {
        existingCanonicalName.aliases.push({ aliasesId, alias });
      } else {
        //No alias to add
      }

      return canonicalNamesAndAliases;
    }, []);
  }

  displayCanonicalNameInput() {
    this.canonicalNameControl = new FormControl('');
  }

  removeCanonicalNameInput() {
    this.canonicalNameControl = undefined;
  }

  saveCanonicalName() {
    if (this.canonicalNameControl.value && this.canonicalNameCategoryControl.value) {
      const canonicalName = removePunctuation(this.canonicalNameControl.value);
      if (this.checkIfNameExists(canonicalName)) {
        this.canonicalNameControl.setErrors({ valueExists: 'Please add a name that does not already exist.' });
      } else {
        this.addCanonicalName();
      }
    } else {
      // No value to save
    }
  }

  checkIfNameExists(canonicalName: string) {
    const canonicalNames = this.canonicalNameAndAliases;
    return canonicalNames.some((name) => removePunctuation(name.canonicalName) === removePunctuation(canonicalName));
  }


  addCanonicalName() {
    this.skillsService.addCanonicalName(this.canonicalNameControl.value, this.canonicalNameCategoryControl.value.canonicalNameCategoryId).subscribe({
      next: (newCanonicalName) => {
        this.handleCanonicalNameAdded(newCanonicalName, this.canonicalNameCategoryControl.value.canonicalNameCategory);
        this.canonicalNameControl.reset();
        this.matSnackBar.open('Canonical name successfully added.', 'dismiss', { duration: 3000 });
        this.removeCanonicalNameInput();
      },
      error: (_error) => {
        this.canonicalNameControl.setErrors({ valueExists: 'Canonical name already exists.' });
      },
    });
  }

  handleCanonicalNameAdded(newCanonicalName: CanonicalName, category: string) {
    this.canonicalNameAndAliases = [
      ...this.canonicalNameAndAliases,
      {
        ...newCanonicalName, aliases: [],
        canonicalNameCategory: category,
        inGraphDB: false,
      },
    ]
  }

  handleAliasRemoved(deletedAlias: { canonicalNameId: number; aliasId: number }) {
    this.canonicalNameAndAliases = this.canonicalNameAndAliases.map((canonicalName) => {
      if (canonicalName.canonicalNamesId === deletedAlias.canonicalNameId) {
        return {
          ...canonicalName,
          aliases: canonicalName.aliases.filter((alias) => alias.aliasesId !== deletedAlias.aliasId),
        };
      } else {
        return canonicalName;
      }
    });
  }

  handleAliasAdded(newAlias: { canonicalNameId: number; alias: Alias }) {
    this.canonicalNameAndAliases = this.canonicalNameAndAliases.map((alias) => {
      if (alias.canonicalNamesId === newAlias.canonicalNameId) {
        return {
          ...alias,
          aliases: [...alias.aliases, newAlias.alias],
        };
      } else {
        return alias;
      }
    });
  }
}
