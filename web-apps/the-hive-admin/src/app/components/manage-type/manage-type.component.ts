import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { LevelUpService } from '../../services/level-up.service';
import { SideQuestService } from '../../services/side-quest.service';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';
import { contentTypeCodes } from '../../shared/enums';
import { TypeInterface } from '../table-type/table-type.component';

@Component({
    selector: 'app-manage-type',
    templateUrl: './manage-type.component.html',
    styleUrls: ['./manage-type.component.css'],
    standalone: false
})
export class ManageTypeComponent implements OnInit, OnDestroy {
  dataSubscription: Subscription = new Subscription();

  manageTypeForm: UntypedFormGroup;
  error = false;
  images$: Observable<any>;

  @Output() onSave = new EventEmitter();
  @Output() cancel = new EventEmitter<void>();

  private _typeName;
  @Input()
  set typeName(typeName) {
    this._typeName = typeName || '';
    this.setFormValues();
  }
  get typeName() {
    return this._typeName;
  }
  @Input() contentType: contentTypeCodes;
  @Input() imageMethod: string;
  private typeService: SideQuestService | LevelUpService;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private sideQuestService: SideQuestService,
    private levelUpService: LevelUpService,
    public matcher: CreateContentErrorStateMatcher
  ) {
    this.manageTypeForm = this.formBuilder.group({
      code: ['', Validators.compose([Validators.required, Validators.pattern(/^[a-z\-]+$/), Validators.maxLength(20)])],
      name: ['', Validators.compose([Validators.required, Validators.maxLength(50)])],
      icon: ['', Validators.compose([Validators.required, Validators.maxLength(37)])],
      description: ['', Validators.compose([Validators.required, Validators.maxLength(1000)])],
    });
  }

  ngOnInit(): void {
    switch (this.contentType) {
      case contentTypeCodes.sideQuestType:
        this.typeService = this.sideQuestService;
        break;
      case contentTypeCodes.levelUpActivityType:
        this.typeService = this.levelUpService;
        break;
    }
    this.images$ = this.typeService[this.imageMethod]();
  }

  setFormValues() {
    if (this._typeName) {
      for (const prop in this.typeName) {
        if (this.manageTypeForm.controls[prop]) {
          this.manageTypeForm.controls[prop].setValue(this.typeName[prop]);
        }
      }
    }
  }

  updateType() {
    if (this.manageTypeForm.valid) {
      this.error = false;

      const formValue = this.manageTypeForm.getRawValue();

      const { name, description, icon, code } = formValue;

      const updatedType: TypeInterface = {
        id: this.typeName.id,
        name,
        icon,
        description,
        code,
      };

      this.onSave.emit(updatedType);
    } else {
      this.error = true;
    }
  }

  onCancel() {
    this.cancel.emit()
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}