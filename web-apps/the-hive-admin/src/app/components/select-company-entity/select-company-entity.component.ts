/** @format */
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CompanyEntity, CompanyEntityService } from "../../services/company-entities.service";
import { EnvironmentService } from "../../services/environment.service";
import { MatDividerModule } from "@angular/material/divider";
import { MatCheckboxModule } from "@angular/material/checkbox";

@Component({
    selector: "select-company-entity",
    templateUrl: "./select-company-entity.component.html",
    styleUrls: ['./select-company-entity.component.css', '../../../styles.css'],
    imports: [CommonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatDividerModule, MatCheckboxModule]
})
export class SelectCompanyEntities implements OnInit {
  companyEntities: CompanyEntity[] = [];
  selectedEntities = new FormControl();
  snackbarDuration: number = undefined;
  @Input() label = "Select company entity";
  @Output() entitySelected = new EventEmitter<CompanyEntity[]>();

  constructor(
    private readonly companyEntityService: CompanyEntityService,
    private readonly snackBar: MatSnackBar,
    private readonly environmentService: EnvironmentService,
  ) {}

  ngOnInit(): void {
    this.initializeEntitySelectionSubscription();
    this.getCompanyEntitiesData();
    this.snackbarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
  }

  getCompanyEntitiesData() {
    this.companyEntityService.getAllCompanyEntities().subscribe({
      next: (data) => {
        this.companyEntities = data;
        this.selectedEntities.setValue(this.companyEntities);
      },
      error: (error) => {
        this.snackBar.open(`Error fetching company entities:${error}`, "dismiss", {
          duration: this.snackbarDuration,
        });
      },
    });
  }

  initializeEntitySelectionSubscription() {
    this.selectedEntities.valueChanges.subscribe((selectedEntities) => {
      this.entitySelected.emit(selectedEntities);
    });
  }

  setSelectedEntities(selectedCompanyEntities: CompanyEntity[]) {
    this.selectedEntities.setValue(selectedCompanyEntities);
  }

  areAllCompanyEntitiesSelected():boolean{
    return this.selectedEntities.value?.length === this.companyEntities.length;
  }
  
  toggleAllCompanyEntitySelection() {
    this.selectedEntities.setValue(this.areAllCompanyEntitiesSelected() ? [] : [...this.companyEntities]);
  }
  
  get toggleAllEntitySelectionText(): string {
    if (this.selectedEntities.value?.length === this.companyEntities.length) {
      return 'Deselect all';
    } else {
      return 'Select all';
    }   
  }

  compareCompanyEntities(companyEntity1: CompanyEntity, companyEntity2: CompanyEntity): boolean {
    return companyEntity1.companyEntityId === companyEntity2.companyEntityId;
  }
}
