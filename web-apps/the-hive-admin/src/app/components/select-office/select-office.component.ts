/** @format */
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule, MatError } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { Office, OfficeService } from "../../services/offices-service";
import { MatDividerModule } from "@angular/material/divider";
import { MatCheckboxModule } from "@angular/material/checkbox";

@Component({
    selector: "select-office",
    templateUrl: "./select-office.component.html",
    styleUrls: ['./select-office.component.css', '../../../styles.css'],
    imports: [CommonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatDividerModule, MatCheckboxModule, MatError]
})
export class SelectOffices implements OnInit {
  offices: Office[] = [];
  selectedOffices = new FormControl();
  @Input() label = "Select company entity";
  @Input() selectionRequired = false;
  @Output() officeSelected = new EventEmitter<Office[]>();

  constructor(
    private readonly officeService: OfficeService,
  ) {}

  ngOnInit(): void {
    this.retrieveOffices();
    this.onOfficeSelectionChange();
  }

  retrieveOffices() {
    this.officeService.retrieveAllOffices().subscribe({
      next: (data) => {
        this.offices = data;
        this.selectedOffices.setValue(this.offices);
      }
    });
  }

  setSelectedOffices(selectedOffices: Office[]) {
    this.selectedOffices.setValue(selectedOffices);
  }

  onOfficeSelectionChange() {
    this.selectedOffices.valueChanges.subscribe((selectedEntities) => {
      this.validateSelection();
      this.officeSelected.emit(selectedEntities);
    });
  }

  areAllOfficesSelected():boolean{
    return this.selectedOffices.value?.length === this.offices.length;
  }
  
  toggleAllOfficeSelection() {
    this.selectedOffices.setValue(this.areAllOfficesSelected() ? [] : [...this.offices]);
  }
  
  get toggleAllOfficeSelectionText(): string {
    if (this.selectedOffices.value?.length === this.offices.length) {
      return 'Deselect all';
    } else {
      return 'Select all';
    }
  }   

  compareOffices(office1: Office, office2: Office): boolean {
    return office1.officeId === office2.officeId;
  }

  get empty(): boolean {
    return !this.selectedOffices.value || this.selectedOffices.value.length === 0;
  }

  validateSelection(): void {
    this.selectedOffices.markAsTouched();
    this.updateValidationState();
  }

  updateValidationState(): void {
    if (this.selectionRequired && this.empty && this.selectedOffices.touched) {
      this.selectedOffices.setErrors({ required: true });
    } else {
      this.selectedOffices.setErrors(undefined);
    }
  }
}