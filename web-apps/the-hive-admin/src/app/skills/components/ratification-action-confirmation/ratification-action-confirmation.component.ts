import { Component, Input, Output,signal, SimpleChanges, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CANCELLED_RATIFICATION_ACTION, RATIFICATION_ACTION, RatificationAction, SkillsService } from '../../services/skills.service';
import { CanonicalNameDetails, SkillsEntity, InstitutionType, TopLevelTag, UserAttribute, Staff, isAttributeType } from '@the-hive/lib-skills-shared';
import { SkillsEntityAndRatificationAction } from '../attribute-ratification-table/attribute-ratification-table.component';
import { SkillsSearchBarComponent } from '../skills-search-bar/skills-search-bar.component';
import { MatInputModule } from '@angular/material/input'; 
import { BehaviorSubject, catchError, of, switchMap } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { allInstitutionTypes } from '@the-hive/lib-skills-shared';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InstitutionSearchBarComponent } from '../institution-search-bar/institution-search-bar.component';
import { Attribute, Institution } from '@the-hive/lib-skills-shared';
import { BadRequestDetail, isError } from '@the-hive/lib-shared';

@Component({
  selector: 'app-ratification-action-confirmation',
  templateUrl: './ratification-action-confirmation.component.html',
  styleUrls: ['./ratification-action-confirmation.component.css',  '../../../shared/shared.css'],
  imports: [
    CommonModule,
    SkillsSearchBarComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    InstitutionSearchBarComponent,
    MatError
  ]
})
export class RatificationActionConfirmationComponent implements OnInit, OnChanges {
  @Input() skillsEntityAndRatificationAction: SkillsEntityAndRatificationAction;
  @Input() topLevelTag: TopLevelTag;
  @Input() affectedStaffMembers: (Pick<Staff, 'upn' | 'displayName'> & UserAttribute)[]
  @Output() actionCompleted = new EventEmitter<SkillsEntityAndRatificationAction | 'Cancelled'>();
  selectedAttribute = signal<CanonicalNameDetails | undefined>(undefined);
  attributeCanonicalNameDetails$: BehaviorSubject<CanonicalNameDetails> = new BehaviorSubject<CanonicalNameDetails>(undefined);
  institutionTypes = allInstitutionTypes;
  selectedInstitutionType = new FormControl<InstitutionType>(undefined);
  newCanonicalNameControl = new FormControl('');
  errorMessage: BadRequestDetail = undefined;

  constructor(
    private skillsService: SkillsService
  ) {}

  ngOnInit(): void {
    this.newCanonicalNameControl.setValue(this.skillsEntityAndRatificationAction.skillsEntity.canonicalName);
    this.attributeCanonicalNameDetails$.next(this.skillsEntityAndRatificationAction.skillsEntity);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['skillsEntityAndRatificationAction']) {
      this.selectedAttribute.set(undefined);
      this.attributeCanonicalNameDetails$.next(this.skillsEntityAndRatificationAction.skillsEntity);
    } else {
      // skillsEntityAndRatificationAction did not change, so we do not need to retrieve the affectedStaffMembers
    }
  }

  onSearchOptionSelected(selectedAttribute: CanonicalNameDetails) {
    this.selectedAttribute.set(selectedAttribute);
  }
  approveAttributeOrInstitution(selectedAttribute: SkillsEntity) {
    this.attributeCanonicalNameDetails$.next(undefined);
    if (this.topLevelTag.standardizedName !== "institution") {
      this.skillsService.ratifyAttribute(selectedAttribute.standardizedName, selectedAttribute.canonicalName)
      .pipe(catchError((error) => of({ message: error })))
      .subscribe((attributeCanonicalNameDetails) => this.emitCompletedActionOrSetError(attributeCanonicalNameDetails));
    } else {
      this.skillsService.updateInstitution(selectedAttribute.standardizedName, false, this.selectedInstitutionType.value, selectedAttribute.canonicalName)
      .pipe(catchError((error) => of({ message: error })))
      .subscribe((attributeCanonicalNameDetails) => this.emitCompletedActionOrSetError(attributeCanonicalNameDetails));
    }
  }

  rejectAttributeOrInstitution(selectedAttributeOrInstitution: SkillsEntity) {
    this.attributeCanonicalNameDetails$.next(undefined);
    if ( isAttributeType(this.topLevelTag.standardizedName )) {
      this.skillsService.rejectNewUserAttribute(selectedAttributeOrInstitution.standardizedName)
        .pipe(catchError((error) => of({ message: error })))
        .subscribe((attributeCanonicalNameDetails) => this.emitCompletedActionOrSetError(attributeCanonicalNameDetails));
    } else {
      this.skillsService.rejectNewInstitution(selectedAttributeOrInstitution.standardizedName)
      .pipe(catchError((error) => of({ message: error })))
      .subscribe((attributeCanonicalNameDetails) => this.emitCompletedActionOrSetError(attributeCanonicalNameDetails));
    }
  }

  findHandlerForRatificationAction(skillsEntityAndRatificationAction: SkillsEntityAndRatificationAction): ((selectedAttribute: SkillsEntity) => void) | void {
    switch(skillsEntityAndRatificationAction.ratificationAction) {
      case RATIFICATION_ACTION.accept: return this.approveAttributeOrInstitution;
      case RATIFICATION_ACTION.reject: return this.rejectAttributeOrInstitution;
      case RATIFICATION_ACTION.merge: return this.mergeAttributeOrInstitution;
      case RATIFICATION_ACTION.changeCanonicalName: return this.editCanonicalName;
    }
  }

  handleRatificationAction(skillsEntityAndRatificationAction: SkillsEntityAndRatificationAction) {
    const handler = this.findHandlerForRatificationAction(skillsEntityAndRatificationAction);
    if (handler) {
      handler.call(this, skillsEntityAndRatificationAction.skillsEntity);
    } else {
      // ratification action not supported
    }
  }

  mergeAttributeOrInstitution(skillsEntity: SkillsEntity) {
    this.attributeCanonicalNameDetails$.next(undefined);
    if (this.topLevelTag.standardizedName !== "institution") {
      this.skillsService.mergeAttributes(skillsEntity.standardizedName, this.selectedAttribute().canonicalName)
      .pipe(catchError((error) => of({ message: error })))
      .subscribe((attributeCanonicalNameDetails) => this.emitCompletedActionOrSetError(attributeCanonicalNameDetails));
    } else {
      this.skillsService.mergeInstitutions(skillsEntity.standardizedName, this.selectedAttribute().canonicalName)
      .pipe(catchError((error) => of({ message: error })))
      .subscribe((attributeCanonicalNameDetails) => this.emitCompletedActionOrSetError(attributeCanonicalNameDetails));
    }
  }

  editCanonicalName(selectedAttribute: SkillsEntity) {
    this.attributeCanonicalNameDetails$.next(undefined);
    const newCanonicalName = this.newCanonicalNameControl.value;
    if (this.topLevelTag.standardizedName === "institution") {
      this.skillsService.updateInstitution(selectedAttribute.standardizedName,false,undefined,newCanonicalName)
      .pipe(catchError((error) => of({ message: error })))
      .subscribe((attributeCanonicalNameDetails) => this.emitCompletedActionOrSetError(attributeCanonicalNameDetails));
    } else {
      this.skillsService.retrieveAttribute(selectedAttribute.standardizedName)
      .pipe(
        catchError((error) => of({ message: error })),
        switchMap((attribute: Attribute | BadRequestDetail) =>
          isError(attribute) ? of(attribute) :
          this.skillsService.updateAttribute({
            ...attribute,
            canonicalName: newCanonicalName
          })
        )
      ).subscribe((attributeCanonicalNameDetails) => this.emitCompletedActionOrSetError(attributeCanonicalNameDetails));
    }
  }

  cancelAction() {
    this.actionCompleted.emit(CANCELLED_RATIFICATION_ACTION);
  }

  getConfirmationMessage(): string {
    const { ratificationAction, skillsEntity: { canonicalName } } = this.skillsEntityAndRatificationAction;
    const selectedAttributeCanonicalName = this.selectedAttribute()?.canonicalName || '';

    const actionsMap = {
      Accept: 'accept',
      Merge: 'merge',
      ChangeCanonicalName: 'change the canonical name of',
      Reject: 'reject',
    };

    const confirmationMessage = `Are you sure you want to ${actionsMap[ratificationAction]} "${canonicalName}"${selectedAttributeCanonicalName ? ` with "${selectedAttributeCanonicalName}"` : ''}?`;

    return confirmationMessage;
  }
  
  isRatificationActionEqualTo(ratificationAction: RatificationAction, action: RatificationAction) {
    return ratificationAction === action;
  }

  generateSupportEmail(badRequestDetail: BadRequestDetail): string {
    const subject = encodeURIComponent('Error on Ratification page');
    const body = encodeURIComponent(`Hi,\n\nI am getting this error on Ratification page: "${badRequestDetail.message}".`);
    return `mailto:skills-support@bbd.co.za?subject=${subject}&body=${body}`;
  }

  emitCompletedActionOrSetError(attributeCanonicalNameDetails: Attribute | Institution | BadRequestDetail) {
    if (isError(attributeCanonicalNameDetails)) {
      this.attributeCanonicalNameDetails$.next(this.skillsEntityAndRatificationAction.skillsEntity);
      this.errorMessage = attributeCanonicalNameDetails;
    } else {
      this.actionCompleted.emit(this.skillsEntityAndRatificationAction);
    }
  }
}