import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';
import { UnitsInterface } from '../table-unit/table-unit.component';

@Component({
    selector: 'app-manage-units',
    templateUrl: './manage-units.component.html',
    styleUrls: ['./manage-units.component.css'],
    standalone: false
})
export class ManageUnitsComponent implements OnInit, OnDestroy {
  private dataSubscription: Subscription = new Subscription();
  unitsForm: UntypedFormGroup;
  @Output() onSave = new EventEmitter();
  error = false;
  private _unit;
  @Input()
  set unit(unit) {
    this._unit = unit || '';
    this.setFormValues();
  }
  get unit() {
    return this._unit;
  }

  constructor(
    private formBuilder: UntypedFormBuilder,
    public matcher: CreateContentErrorStateMatcher
  ) {
    this.unitsForm = this.formBuilder.group({
      unitId: [{ value: null, disabled: true }, Validators.compose([Validators.required])],
      name: ['', Validators.compose([Validators.required, Validators.maxLength(20)])],
      description: ['', Validators.compose([Validators.required, Validators.maxLength(100)])],
    });
  }

  ngOnInit() {}

  setFormValues() {
    if (this._unit) {
      for (const prop in this.unit) {
        if (this.unitsForm.controls[prop]) {
          this.unitsForm.controls[prop].setValue(this.unit[prop]);
        }
      }
    }
  }

  updateUnit() {
    if (this.unitsForm.valid) {
      this.error = false;

      const formValue = this.unitsForm.getRawValue();

      const { unitId, name, description } = formValue;

      const updatedUnit: UnitsInterface = {
        unitId,
        name,
        description,
        currentlyBeingEdited: false,
      };

      this.onSave.emit(updatedUnit);
    } else {
      this.error = true;
    }
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
