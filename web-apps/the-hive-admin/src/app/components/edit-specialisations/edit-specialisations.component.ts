import { Component, Output, EventEmitter, Input, OnChanges, ViewChild, OnInit } from '@angular/core';
import { SpecialisationsService } from '../../services/specialisations.service';
import { switchMap, map } from 'rxjs/operators';
import { Specialisation } from '../../shared/interfaces';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StaffFilterComponent } from '../staff-filter/staff-filter.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-edit-specialisations',
    templateUrl: './edit-specialisations.component.html',
    styleUrls: ['./edit-specialisations.component.css'],
    standalone: false
})
export class EditSpecialisationsComponent implements OnInit, OnChanges {
  @Input() guideUserPrincipleName: string;

  @Output() guideSaved = new EventEmitter<boolean>();
  @Output() clear = new EventEmitter<boolean>();

  @ViewChild(StaffFilterComponent) staffFilterComponent;

  guideSpecialisations: Specialisation[];
  specialisations: Specialisation[];
  selectedSpecialisations: Specialisation[] = [];

  form: FormGroup;

  constructor(
    private snackBar: MatSnackBar,
    private specialisationsService: SpecialisationsService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      guideUserPrincipleName: new FormControl('', [Validators.required, Validators.email]),
      selectedSpecialisations: new FormControl(this.selectedSpecialisations.length, [Validators.required, Validators.min(1)]),
    });
  }

  ngOnChanges(): void {
    this.fetchSpecialisations();
  }

  fetchSpecialisations() {
    if (this.guideUserPrincipleName !== undefined) {
      this.specialisationsService.getGuidepecialisations(this.guideUserPrincipleName)
        .pipe(
          switchMap((specialisations) => {
            this.guideSpecialisations = specialisations;
            return this.specialisationsService.getSpecialisations();
          }),
          map((specialisations) => specialisations.filter((spec) => {
           return !this.guideSpecialisations.find((s) => s.specialisationId === spec.specialisationId);
          }))
        ).subscribe((specialisations) => this.specialisations = specialisations);
    } else { 
      this.specialisationsService.getSpecialisations()
        .subscribe((specialisations) => this.specialisations = specialisations);
    }
  }

  saveSpecialisations() { 
    this.setFormValues();
    if (this.form.valid) {
      this.specialisationsService
          .addSpecialisations(this.guideUserPrincipleName, this.selectedSpecialisations)
          .subscribe({
            next: (_res) => {
              this.snackBar.open('Specialisations saved successfully.', 'Dismiss', { duration: 3000 });
              this.guideSaved.emit(true);
            },
            error: (error) => {
              this.snackBar.open(error, 'Dismiss', { duration: 3000 });
            }
          });
    } else {
      //Selected specialisations are not saved
    }
  }

  setFormValues() {
    this.form.setValue({
      guideUserPrincipleName: this.guideUserPrincipleName || '',
      selectedSpecialisations: this.selectedSpecialisations.length
    });
    this.form.markAllAsTouched();
  }

  selectGuide() {
    this.guideUserPrincipleName = this.staffFilterComponent.selectedUserPrinciple.userPrincipleName;
    this.fetchSpecialisations();
  }

  selectSpecialisation(selectedSpecialisation: Specialisation) {
    this.selectedSpecialisations.push(selectedSpecialisation);
    this.specialisations = this.specialisations.filter((specialisation) => specialisation !== selectedSpecialisation);
  }

  unselectSpecialisation(unselectedSpecialisation: Specialisation) {
    this.specialisations.push(unselectedSpecialisation);
    this.selectedSpecialisations = this.selectedSpecialisations.filter((specialistion) => specialistion !== unselectedSpecialisation);
  }

  clearSelection() {
    this.guideUserPrincipleName = undefined;
    this.specialisations = [...this.specialisations, ...this.selectedSpecialisations];
    this.selectedSpecialisations = [];
    this.clear.emit(true);
  }
}
