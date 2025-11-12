import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CanonicalNameDetails, JsType, JSTypeScale, RatificationSummary, SkillField, StandardizedName, TopLevelTag } from '@the-hive/lib-skills-shared';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { CANCELLED_RATIFICATION_ACTION, CancelledRatificationAction, SkillsService } from '../../services/skills.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AttributeRatificationTableComponent, SkillsEntityAndRatificationAction } from '../attribute-ratification-table/attribute-ratification-table.component';
import { RatificationActionConfirmationComponent } from '../ratification-action-confirmation/ratification-action-confirmation.component';
import { AttributeCanonicalNameDetailsWithInstitutionAndRatificationAction, AvailableAtRatificationTableComponent } from '../available-at-ratification-table/available-at-ratification-table.component';
import { AvailableAtRatificationActionConfirmationComponent } from '../available-at-ratification-action-confirmation/available-at-ratification-action-confirmation';
import { AffectedStaffMembersComponent } from '../affected-staff-members/affected-staff-members.component';
import { MatDivider } from '@angular/material/divider';
import { BadRequestDetail, isError } from '@the-hive/lib-shared';
import { MatError } from '@angular/material/form-field';

@Component({
    selector: 'app-ratification-tab',
    templateUrl: './ratification-tab.component.html',
    styleUrls: ['../../../../styles.css', './ratification-tab.component.css', '../../../shared/shared.css'],
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        MatExpansionModule,
        MatIconModule,
        MatTooltipModule,
        AttributeRatificationTableComponent,
        RatificationActionConfirmationComponent,
        AvailableAtRatificationTableComponent,
        AvailableAtRatificationActionConfirmationComponent,
        AffectedStaffMembersComponent,
        MatDivider,
        MatError
    ]
})
export class RatificationTabComponent implements OnInit {
  ratificationSummary$: Observable<RatificationSummary[]>;
  selectedStandardizedName$: BehaviorSubject<StandardizedName>;
  topLevelTags: TopLevelTag[];
  skillsFields: SkillField[] = undefined;
  jsTypes: JsType[] = undefined;
  jsTypeScales: JSTypeScale[] = undefined;
  @ViewChild(AttributeRatificationTableComponent) attributeRatificationTable!: AttributeRatificationTableComponent;
  @ViewChild(AvailableAtRatificationTableComponent) availableAtRatificationTable!: AvailableAtRatificationTableComponent;
  @ViewChild(AffectedStaffMembersComponent) affectedStaffMembers! : AffectedStaffMembersComponent;

  skillsEntityAndRatificationAction$ = new BehaviorSubject<SkillsEntityAndRatificationAction>(undefined);
  ratificationActionAndCanonicalNameDetails$ = new BehaviorSubject<AttributeCanonicalNameDetailsWithInstitutionAndRatificationAction>(undefined);
  selectedAttribute$ = new BehaviorSubject<CanonicalNameDetails | undefined>(undefined);
  isError = isError;

  constructor(private skillsService: SkillsService) {}

  async ngOnInit() {
    await this.retrieveSkillTypes();
    this.skillsService.retrieveTopLevelTags().then(topLevelTags => {
      this.topLevelTags = topLevelTags.sort((topLevelTag1, topLevelTag2) =>
        topLevelTag1.attributeTypeOrder - topLevelTag2.attributeTypeOrder
      );
      this.selectedStandardizedName$ = new BehaviorSubject<StandardizedName>(this.topLevelTags[0].standardizedName);
    });
    this.ratificationSummary$ = this.skillsService.getUnratifiedAttributesSummary();
  }

  async retrieveSkillTypes() {
    this.skillsFields = await this.skillsService.getSkillsFields();
    this.jsTypes = await this.skillsService.getJSTypes();
    this.jsTypeScales = await this.skillsService.getJSTypeScale();
  }

  getRatificationCountForStandardizedName(standardizedName: StandardizedName, ratificationSummary: RatificationSummary[]): number | undefined {
    const summary = ratificationSummary.find(ratificationSummaryItem => ratificationSummaryItem.standardizedName.includes(standardizedName));
    return summary ? summary.count : undefined;
  }

  setActiveStandardizedName(standardizedName: StandardizedName) {
    this.selectedStandardizedName$.next(standardizedName);
    this.skillsEntityAndRatificationAction$.next(undefined);
    this.ratificationActionAndCanonicalNameDetails$.next(undefined);
    this.closeAffectedStaffMembersView();
  }

  isStandardizedNameTopLevelTag(standardizedName: StandardizedName | undefined): boolean {
    return standardizedName && this.topLevelTags.some(topLevelTag => topLevelTag.standardizedName === standardizedName);
  }

  getTopLevelTagForStandardizedName(standardizedName: StandardizedName): TopLevelTag | BadRequestDetail {
    const topLevelTag = this.topLevelTags?.find(topLevelTag => topLevelTag.standardizedName === standardizedName);
    if (!topLevelTag) {
      return { message: `Unable to find topLevelTag for standardizedName: ${standardizedName}`};
    } else {
      return topLevelTag;
    }
  }

  handleRatificationActionAndCanonicalNameDetails(event: SkillsEntityAndRatificationAction) {
    this.skillsEntityAndRatificationAction$.next(event);
  }

  handleRatificationActionAndAvailableAt(event: AttributeCanonicalNameDetailsWithInstitutionAndRatificationAction) {
    this.ratificationActionAndCanonicalNameDetails$.next(event);
  }

  onActionCompletedForAttribute(completedAction: SkillsEntityAndRatificationAction | CancelledRatificationAction, ratificationSummary: RatificationSummary[]) {
    this.skillsEntityAndRatificationAction$.next(undefined);
    this.attributeRatificationTable?.onActionCompleted(completedAction);

    if (completedAction !== CANCELLED_RATIFICATION_ACTION) {
      this.reduceRatificationCount(ratificationSummary);
    } else {
      // action was cancelled so no need to update ratification summary
    }
  }

  onActionCompletedForAvailableAt(completedAction: AttributeCanonicalNameDetailsWithInstitutionAndRatificationAction | CancelledRatificationAction, ratificationSummary: RatificationSummary[]) {
    this.ratificationActionAndCanonicalNameDetails$.next(undefined);
    this.availableAtRatificationTable?.onActionCompleted(completedAction);

    if (completedAction !== CANCELLED_RATIFICATION_ACTION) {
      this.reduceRatificationCount(ratificationSummary);
    } else {
      // action was cancelled so no need to update ratification summary
    }
  }

  private reduceRatificationCount(ratificationSummary: RatificationSummary[]) {
    const updatedRatificationSummary = ratificationSummary.map(summaryItem => 
      summaryItem.standardizedName.includes(this.selectedStandardizedName$.value) ?
        { ...summaryItem, count: summaryItem.count - 1 } 
        :
        summaryItem
    );

    this.ratificationSummary$ = of(updatedRatificationSummary);
  }

  invokeAffectedStaffMembersView(attributeCanonicalNameDetails: CanonicalNameDetails) {
    this.selectedAttribute$.next(attributeCanonicalNameDetails);
  }

  closeAffectedStaffMembersView() {
    this.selectedAttribute$.next(undefined);
  }

  generateSupportEmail(badRequestDetail: BadRequestDetail): string {
    const subject = encodeURIComponent('Error on Ratification page');
    const body = encodeURIComponent(`Hi,\n\nI am getting this error on Ratification page: "${badRequestDetail.message}".`);
    return `mailto:skills-support@bbd.co.za?subject=${subject}&body=${body}`;
  }
}