/** @format */
import { Component, Input, OnInit } from "@angular/core";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatChipsModule } from "@angular/material/chips";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ReactiveFormsModule, FormControl, Validators } from "@angular/forms";
import { CanonicalName, SkillsService } from "../../services/skills.service";
import { CommonModule } from "@angular/common";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BadRequestDetail, TopLevelTag  } from "@the-hive/lib-skills-shared";
import { EnvironmentService } from "../../../services/environment.service";
import { catchError, from, map, Observable, of } from "rxjs";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { isError } from "@the-hive/lib-shared";
import { MatError } from "@angular/material/form-field";
@Component({
    selector: "app-canonical-name-card",
    templateUrl: "./canonical-name-card.component.html",
    styleUrls: ["./canonical-name-card.component.css"],
    imports: [
        CommonModule,
        MatSnackBarModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatChipsModule,
        MatButtonModule,
        MatIconModule,
        ReactiveFormsModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatError
    ]
})
export class CanonicalNameCardComponent implements OnInit {
  @Input() canonicalName: CanonicalName;
  canonicalNameCategory$: Observable<TopLevelTag | BadRequestDetail>;
  aliasControl = new FormControl("");
  newCanonicalName: FormControl<string>;
  snackbarDuration: number = undefined;

  constructor(readonly skillsService: SkillsService, readonly matSnackBar: MatSnackBar,readonly environmentService: EnvironmentService) {}

  ngOnInit(): void {
    this.snackbarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
    this.canonicalNameCategory$ = from(this.skillsService.retrieveTopLevelTags()).pipe(
      map((categories) => categories.find((category) => category.standardizedName === this.canonicalName.canonicalNameCategory)),
      catchError((error) => {
        return of({message: 'Error retrieving canonical name category', detail: error});
      })
    );
  }

  editCanonicalName(): void {
    this.newCanonicalName = new FormControl(this.canonicalName.canonicalName, [Validators.required]);
  }

  isError(canonicalNameCategory: TopLevelTag | BadRequestDetail): boolean {
    return isError(canonicalNameCategory);
  }
  
  updateCanonicalName(): void {
    if (this.newCanonicalName.valid) {
      const { canonicalNamesId, canonicalNameCategoryId, canonicalNameCategory, standardizedName } = this.canonicalName;

      this.skillsService
        .updateCanonicalName({
          canonicalName: this.newCanonicalName.value,
          canonicalNameId: canonicalNamesId,
          canonicalNameCategoryId,
          canonicalNameCategory,
          standardizedName,
        })
        .subscribe({
          next: (updatedCanonicalName) => {
            this.canonicalName.canonicalName = updatedCanonicalName;
            this.matSnackBar.open("Name successfully updated.", "dismiss", { duration: 3000 });
          },
          error: (error) => {
            this.matSnackBar.open(error, "dismiss", { duration: 3000 });
          },
        });
      this.cancelEditingCanonicalName();
    } else {
      //Do not submit change if the input value is invalid.
    }
  }

  cancelEditingCanonicalName(): void {
    this.newCanonicalName = undefined;
  }

  generateSupportEmail(error: BadRequestDetail): string {
    const subject = encodeURIComponent('Error retrieving canonical name category');
    const body = encodeURIComponent(
      `Hi,\n\nI am getting an error retrieving the canonical name category for ${this.canonicalName?.canonicalName} on the edit canonical name tab.\n` +
      `Error Message: ${error.detail}\n`
    );
    return `mailto:skills-support@bbd.co.za?subject=${subject}&body=${body}`;
  }
}
