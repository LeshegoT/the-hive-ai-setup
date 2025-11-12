/** @format */
import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { BehaviorSubject } from "rxjs";
import { debounceTime, distinctUntilChanged, startWith } from "rxjs/operators";
import { EnvironmentService } from "../../../services/environment.service";
import { CanonicalName, SkillsService } from "../../services/skills.service";
import { CanonicalNameCardComponent } from "../canonical-name-card/canonical-name-card.component";

@Component({
    selector: "app-manage-canonical-names",
    templateUrl: "./manage-canonical-names.component.html",
    styleUrls: ["./manage-canonical-names.component.css"],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        CanonicalNameCardComponent,
    ]
})
export class ManageCanonicalNames implements OnInit {
  searchText = new FormControl<string>("");
  allCanonicalNames: CanonicalName[] = [];
  displayedCanonicalNames$ = new BehaviorSubject<CanonicalName[] | undefined >(undefined);
  filteredOptions: string[] = [];
  snackBarDuration: number;

  constructor(
    readonly skillsService: SkillsService,
    readonly matSnackBar: MatSnackBar,
    readonly environmentService: EnvironmentService,
  ) {}

  ngOnInit(): void {
    this.snackBarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
    this.skillsService.retrieveCanonicalNames().subscribe({
      next: (data) => {
        this.allCanonicalNames = data;
        this.displayedCanonicalNames$.next(data);
        this.filteredOptions = data.map((name) => name.canonicalName);

        this.searchText.valueChanges.pipe(startWith(""), distinctUntilChanged()).subscribe((searchText) => {
          this.filterCanonicalNames(searchText || "");
        });
      },
      error: (error) => {
        this.matSnackBar.open(`Error fetching names: ${error}`, "Dismiss", {
          duration: this.snackBarDuration,
        });
      },
    });
  }

  private filterCanonicalNames(searchText: string): void {
    const filtered = this.allCanonicalNames.filter((name) =>
      name.canonicalName.toLowerCase().includes(searchText.toLowerCase()),
    );
    this.displayedCanonicalNames$.next(filtered);
    this.filteredOptions = filtered.map((name) => name.canonicalName);
  }

  onSelectCanonicalName(selectedName: string): void {
    const selected = this.allCanonicalNames.find((name) => name.canonicalName === selectedName);
    if (selected) {
      this.displayedCanonicalNames$.next([selected]);
    }
  }

  clearSelection(): void {
    this.searchText.setValue("");
    this.displayedCanonicalNames$.next(this.allCanonicalNames);
    this.filteredOptions = this.allCanonicalNames.map((name) => name.canonicalName);
  }
}
