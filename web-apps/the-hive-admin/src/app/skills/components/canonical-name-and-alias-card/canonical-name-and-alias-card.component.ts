import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { SkillsService, Alias, CanonicalNameWithAliases } from '../../services/skills.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-canonical-name-and-alias-card',
    templateUrl: './canonical-name-and-alias-card.component.html',
    styleUrls: ['./canonical-name-and-alias-card.component.css'],
    imports: [
        CommonModule,
        MatSnackBarModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatChipsModule,
        MatButtonModule,
        MatIconModule,
        ReactiveFormsModule
    ]
})
export class CanonicalNameAndAliasCardComponent {
  @Input() canonicalName: CanonicalNameWithAliases;
  @Input() canonicalNameCategory: string;
  @Output() aliasRemoved = new EventEmitter<{ canonicalNameId: number; aliasId: number }>();
  @Output() aliasAdded = new EventEmitter<{ canonicalNameId: number; alias: Alias }>();
  editableCanonicalName: FormControl<string>;

  aliasControl = new FormControl('');

  constructor(private skillsService: SkillsService, private matSnackBar: MatSnackBar) {}

  removeAlias(canonicalNameId: number, aliasId: number) {
    this.skillsService.deleteAlias(aliasId).subscribe({
      next: () => {
        this.aliasRemoved.emit({ canonicalNameId, aliasId });
        this.matSnackBar.open('Alias successfully removed.', 'dismiss', { duration: 3000 });
      },
      error: () => {
        this.matSnackBar.open('Unable to find alias to delete, please try again.', 'dismiss', { duration: 3000 });
      },
    });
  }

  addAlias(canonicalNameId: number, alias: string) {
    this.skillsService.addAlias(canonicalNameId, alias).subscribe({
      next: (newAlias: Alias) => {
        this.aliasControl.reset();
        this.aliasAdded.emit({ canonicalNameId, alias: newAlias });
        this.matSnackBar.open('Alias successfully added.', 'dismiss', { duration: 3000 });
      },
      error: (_error) => {
        this.aliasControl.setErrors({ error: 'Please add an alias that does not already exist.' });
      },
    });
  }

  saveAlias(canonicalNameId: number, alias: string) {
    if (this.checkIfAliasExists(alias)) {
      this.aliasControl.setErrors({ error: 'Alias already exists.' });
    } else {
      this.addAlias(canonicalNameId, alias);
    }
  }

  checkIfAliasExists(newAlias: string) {
    return this.canonicalName.aliases.some(
      (alias) => alias.alias.toLowerCase() === newAlias.toLowerCase()
    );
  }

  handleAddAlias() {
    if (this.aliasControl.value.trim().length > 0){
      this.saveAlias(this.canonicalName.canonicalNamesId, this.aliasControl.value)
    } else {
      this.aliasControl.setErrors({ error: 'Please enter an alias.' });
    }
  }

  editCanonicalName(): void {
    this.editableCanonicalName = new FormControl(this.canonicalName.canonicalName, [Validators.required]);
  }

  saveCanonicalName(): void {
    if (this.editableCanonicalName.valid){
      this.skillsService.editCanonicalName(this.canonicalName.canonicalNamesId, this.canonicalName.canonicalNameCategory ,this.editableCanonicalName.value)
      .subscribe({
        next: ({updatedCanonicalName}) => {
          this.canonicalName.canonicalName = updatedCanonicalName;
          this.matSnackBar.open('Canonical name successfully updated.', 'dismiss', { duration: 3000 });
        },
        error: (error) => {
          console.log(error)
          this.matSnackBar.open(error, 'dismiss', { duration: 3000 });
        }
      });
      this.cancelEditingCanonicalName();
    } else {
      //Do not submit change if the input value is invalid.
    }
  }  
  
  cancelEditingCanonicalName(): void {
    this.editableCanonicalName = undefined;
  }
}
