/** @format */
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CompanyEntity, CompanyEntityService } from "../../services/company-entities.service";
import { EnvironmentService } from "../../services/environment.service";

@Component({
  selector: "select-company-entity-list",
  templateUrl: "./select-company-entity-list.component.html",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCheckboxModule],
})
export class SelectCompanyEntitiesList implements OnInit {
  companyEntities: CompanyEntity[] = [];
  entityForm: FormGroup;
  snackbarDuration: number = undefined;
  
  @Output() entitySelected = new EventEmitter<CompanyEntity[]>();

  constructor(
    private readonly companyEntityService: CompanyEntityService,
    private readonly snackBar: MatSnackBar,
    private readonly environmentService: EnvironmentService,
    private readonly formBuilder: FormBuilder,
  ) {
    this.entityForm = this.formBuilder.group({});
  }

  ngOnInit(): void {
    this.fetchCompanyEntities();
    this.snackbarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
  }

  fetchCompanyEntities() {
    this.companyEntityService.getAllCompanyEntities().subscribe({
      next: (data) => {
        this.companyEntities = data;
        this.initializeFormControls();
      },
      error: (error) => {
        this.snackBar.open("Error fetching company entities", "dismiss", {
          duration: this.snackbarDuration,
        });
      },
    });
  }

  initializeFormControls() {
    for (const entity of this.companyEntities) {
      this.entityForm.addControl(
        entity.companyEntityId.toString(), 
        new FormControl(true)
      );
    }

    this.entityForm.valueChanges.subscribe(() => {
      this.emitSelectedEntities();
    });

    this.emitSelectedEntities();
  }

  emitSelectedEntities() {
    const selectedEntities = this.companyEntities.filter(entity => 
      this.entityForm.get(entity.companyEntityId.toString())?.value
    );
    this.entitySelected.emit(selectedEntities);
  }
}