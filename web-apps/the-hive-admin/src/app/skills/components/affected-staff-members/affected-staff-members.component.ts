import { Component, Input, Output,SimpleChanges, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SkillsService } from '../../services/skills.service';
import { CanonicalNameDetails, FieldTypeConverter, FieldValue, JsType, JSTypeScale, SkillField, StandardizedName, UserAttributeWithStaffDetails } from '@the-hive/lib-skills-shared';
import { SkillsProofDownloadService } from '../../services/skills-proof-download.service';
import { Staff } from '@the-hive/lib-staff-shared';
import { catchError, from, map, Observable, of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatError } from '@angular/material/form-field';
import { BadRequestDetail, isError } from '@the-hive/lib-shared';
import { MatChip } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-affected-staff-members',
  templateUrl: './affected-staff-members.component.html',
  styleUrls: ['./affected-staff-members.component.css', '../../../shared/shared.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatError,
    MatIcon,
    MatChip,
    MatTooltipModule,
  ]
})
export class AffectedStaffMembersComponent implements OnInit, OnChanges {
  @Input() attributeCanonicalNameDetails: CanonicalNameDetails = undefined;
  @Input() skillsFields: SkillField[] = undefined;
  @Input() jsTypes: JsType[] = undefined;
  @Input() jsTypeScales: JSTypeScale[] = undefined;
  @Output() closeAffectedStaffMembersView = new EventEmitter();
  readonly obtainedFromFieldName = 'obtainedFrom';
  readonly proofFieldName = 'proof';
  fieldTypeConverter: FieldTypeConverter = undefined;
  columnsToDisplay: string[] = ['displayName'];
  affectedStaffMembers$ = new Observable<MatTableDataSource<UserAttributeWithStaffDetails> | BadRequestDetail>;
  staffMembersProofDownloadMap: {[staffId: Staff["staffId"]]: Observable<Staff["upn"] | BadRequestDetail>} = undefined;
  institutionsCanonicalNameMap: {[institutionStandardizedName: StandardizedName]: Observable<string>} = undefined;
  affectedMembers: UserAttributeWithStaffDetails[];
  isError = isError;

  constructor(
    private skillsService: SkillsService,
    private proofDownloadService: SkillsProofDownloadService,
  ) {}

  ngOnInit() {
    this.fieldTypeConverter = new FieldTypeConverter(
      this.skillsService.mapStandardizedNameToCanonicalName,
      this.skillsService.mapStaffIdToDisplayName
    );
    this.getUsersForAttribute();
  }

  findProofFieldValue(user: UserAttributeWithStaffDetails): FieldValue | undefined {
    return user.fieldValues.find(fieldValue => fieldValue.standardizedName === this.proofFieldName);
  }

  findObtainedFromFieldValue(user: UserAttributeWithStaffDetails): FieldValue | undefined {
    return user.fieldValues.find((fieldValue) => fieldValue.standardizedName === this.obtainedFromFieldName);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attributeCanonicalNameDetails']) {
      const previousAttribute = changes['attributeCanonicalNameDetails'].previousValue;
      const currentAttribute = changes['attributeCanonicalNameDetails'].currentValue;
      if (previousAttribute?.standardizedName !== currentAttribute?.standardizedName) {
        this.getUsersForAttribute();
      } else{
        // attributeCanonicalNameDetails changed, but it is the same attribute, so we do not need to retrieve the affectedStaffMembers
      }
    } else {
      // attributeCanonicalNameDetails did not change, so we do not need to retrieve the affectedStaffMembers
    }
  }

  getUsersForAttribute(){
    this.affectedStaffMembers$ = this.skillsService
      .getUsersForAttribute(this.attributeCanonicalNameDetails.standardizedName)
      .pipe(
        catchError((error) => {
            return of({
                message: error
            })
        }),
        map((affectedStaffMembers: UserAttributeWithStaffDetails[] | BadRequestDetail) =>
          this.makeAffectedStaffMembersTable(affectedStaffMembers)
        )
      );
  }

  private makeAffectedStaffMembersTable(affectedStaffMembers: UserAttributeWithStaffDetails[] | BadRequestDetail) : MatTableDataSource<UserAttributeWithStaffDetails> | BadRequestDetail {
    if(isError(affectedStaffMembers)){
      return affectedStaffMembers;
    }else{
      this.affectedMembers = affectedStaffMembers
      this.setDisplayColumns(affectedStaffMembers);
      this.setStaffMembersProofDownloadMap(affectedStaffMembers);
      this.setInstitutionsCanonicalNameMap(affectedStaffMembers);
      return new MatTableDataSource(affectedStaffMembers);
    }
  }

  private setStaffMembersProofDownloadMap(affectedStaffMembers: UserAttributeWithStaffDetails[]) {
    this.staffMembersProofDownloadMap = {};
    for (const affectedStaffMember of affectedStaffMembers) {
      this.staffMembersProofDownloadMap[affectedStaffMember.staffId] = of(affectedStaffMember.upn);
    }
  }

  private setInstitutionsCanonicalNameMap(affectedStaffMembers: UserAttributeWithStaffDetails[]) {
    this.institutionsCanonicalNameMap = {};
    for (const affectedStaffMember of affectedStaffMembers) {
      const obtainedFromFieldValue = this.findObtainedFromFieldValue(affectedStaffMember);
      if (obtainedFromFieldValue) {
        const institutionCanonicalName$ = this.mapInstitutionStandardizedNameToCanonicalName(obtainedFromFieldValue);
        this.institutionsCanonicalNameMap[obtainedFromFieldValue.standardizedName] = institutionCanonicalName$;
      } else {
        // Institution name could not be mapped to it's canonical name so we don't add it to the institutionsCanonicalNameMap
      }
    }
  }

  private setDisplayColumns(affectedStaffMembers: UserAttributeWithStaffDetails[]) {
    if (affectedStaffMembers.some(staff => staff.fieldValues.some(fieldValue => fieldValue.standardizedName === this.proofFieldName))
    && !this.columnsToDisplay.includes(this.proofFieldName)) {
      this.columnsToDisplay.push(this.proofFieldName);
    } else {
      // there is no proof field value so no need to display proof column
    }
  }

  downloadProof(proofValue: string, staffId: Staff["staffId"], upn: Staff["upn"]) {
    this.staffMembersProofDownloadMap[staffId] = this.proofDownloadService.downloadProof(proofValue, upn)
      .pipe(
        catchError((error) => of({ message: error })),
        map((errorMessage: BadRequestDetail) => {
          if(isError(errorMessage)){
            return errorMessage;
          } else{
            return upn;
          }
        })
      );
  }

  createObtainedFromTextForEmail(institutionName: string): string {
    return institutionName ? ` from the ${institutionName}.%0D%0A%0D%0A` : ".%0D%0A%0D%0A";
  }

  private mapInstitutionStandardizedNameToCanonicalName(fieldValue: FieldValue): Observable<string> {
    const fieldMap = this.fieldTypeConverter.createFieldsMap(
      [fieldValue.standardizedName],
      this.skillsFields,
      this.jsTypes,
      this.jsTypeScales);
    const parsedInstitutionName = fieldMap[fieldValue.standardizedName].parse(fieldValue.value);
    return from(fieldMap[fieldValue.standardizedName].toDisplay(parsedInstitutionName));
  }

  generateSupportEmail(badRequestDetail: BadRequestDetail): string {
    const subject = encodeURIComponent('Error on Ratification page');
    const body = encodeURIComponent(`Hi,\n\nI am getting this error on Ratification page: "${badRequestDetail.message}".`);
    return `mailto:skills-support@bbd.co.za?subject=${subject}&body=${body}`;
  }
}