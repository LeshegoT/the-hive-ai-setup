import { Component, Input, Output, SimpleChanges, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AttributeCanonicalNameDetailsWithInstitutionItem, BadRequestDetail } from '@the-hive/lib-skills-shared';
import { AttributeCanonicalNameDetailsWithInstitutionAndRatificationAction } from '../available-at-ratification-table/available-at-ratification-table.component';
import { CANCELLED_RATIFICATION_ACTION, CancelledRatificationAction, RATIFICATION_ACTION, SkillsService } from '../../services/skills.service';
import { isError } from '@the-hive/lib-shared';
import { MatError } from '@angular/material/input';

@Component({
  selector: 'app-available-at-ratification-action-confirmation',
  templateUrl: './available-at-ratification-action-confirmation.component.html',
  styleUrls: ['./available-at-ratification-action-confirmation.component.css', '../../../shared/shared.css'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatError,
  ]
})
export class AvailableAtRatificationActionConfirmationComponent implements OnInit, OnChanges {
  @Input() ratificationActionAndCanonicalNameDetails: AttributeCanonicalNameDetailsWithInstitutionAndRatificationAction;
  @Output() actionCompleted = new EventEmitter<AttributeCanonicalNameDetailsWithInstitutionAndRatificationAction | CancelledRatificationAction>();
  attributeCanonicalNameDetailsWithInstitution$: BehaviorSubject<AttributeCanonicalNameDetailsWithInstitutionItem> = new BehaviorSubject<AttributeCanonicalNameDetailsWithInstitutionItem>(undefined);
  errorMessage: BadRequestDetail = undefined;

  constructor(
    private skillsService: SkillsService
  ) {}

  ngOnInit(): void {
    this.attributeCanonicalNameDetailsWithInstitution$
    .next(this.ratificationActionAndCanonicalNameDetails.attributeCanonicalNameDetailsWithInstitution);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ratificationActionAndCanonicalNameDetails']) {
      this.attributeCanonicalNameDetailsWithInstitution$
      .next(this.ratificationActionAndCanonicalNameDetails.attributeCanonicalNameDetailsWithInstitution);
    } else {
      // ratificationActionAndCanonicalNameDetails did not change so we don't need to update
    }
  }

  handleRatificationAction() {
    this.attributeCanonicalNameDetailsWithInstitution$.next(undefined);
    const institutionForAttributeToBeAvailableAt = this.ratificationActionAndCanonicalNameDetails.attributeCanonicalNameDetailsWithInstitution.availableAt.at(0);
    if(!institutionForAttributeToBeAvailableAt ||isError(institutionForAttributeToBeAvailableAt)) {
      this.actionCompleted.emit(CANCELLED_RATIFICATION_ACTION);
    }else if(this.ratificationActionAndCanonicalNameDetails.ratificationAction === RATIFICATION_ACTION.accept) {
        this.skillsService.ratifyAttribute(
          this.ratificationActionAndCanonicalNameDetails.attributeCanonicalNameDetailsWithInstitution.standardizedName,
          this.ratificationActionAndCanonicalNameDetails.attributeCanonicalNameDetailsWithInstitution.canonicalName,
          [institutionForAttributeToBeAvailableAt]
        ).pipe(
          catchError((error) => {
            return of({
              message: error
            });
          })
        ).subscribe((attributeWithInstitution) => {
          if (attributeWithInstitution && isError(attributeWithInstitution)) {
            this.errorMessage = attributeWithInstitution;
          } else {
            this.actionCompleted.emit(this.ratificationActionAndCanonicalNameDetails);
          }
          this.attributeCanonicalNameDetailsWithInstitution$.next(this.ratificationActionAndCanonicalNameDetails.attributeCanonicalNameDetailsWithInstitution);
        });
    } else if(this.ratificationActionAndCanonicalNameDetails.ratificationAction === RATIFICATION_ACTION.reject) {
        this.skillsService.removeOfferedAttributeFromInstitution(
          this.ratificationActionAndCanonicalNameDetails.attributeCanonicalNameDetailsWithInstitution.standardizedName,
          institutionForAttributeToBeAvailableAt.standardizedName
        ).pipe(
          catchError((error) => {
            return of({
              message: error
            });
          })
        ).subscribe((error) => {
          if (error && isError(error)) {
            this.errorMessage = error;
          } else {
            this.actionCompleted.emit(this.ratificationActionAndCanonicalNameDetails);
          }
          this.attributeCanonicalNameDetailsWithInstitution$.next(this.ratificationActionAndCanonicalNameDetails.attributeCanonicalNameDetailsWithInstitution);
        });
    } else{
      // the ratification action is neither accept or reject so we perform no action
    }
  }

  cancelAction() {
    this.actionCompleted.emit(CANCELLED_RATIFICATION_ACTION);
  }

  generateSupportEmail(badRequestDetail: BadRequestDetail): string {
    const subject = encodeURIComponent('Error on Ratification page');
    const body = encodeURIComponent(`Hi,\n\nI am getting this error on Ratification page: "${badRequestDetail.message}".`);
    return `mailto:skills-support@bbd.co.za?subject=${subject}&body=${body}`;
  }
}