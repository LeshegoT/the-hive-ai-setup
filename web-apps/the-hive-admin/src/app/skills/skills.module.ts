import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LoadingIndicatorComponent } from '../components/loading-indicator/loading-indicator.component';
import { SharedModule } from '../shared.modules';
import { AttributeRatificationCardComponent } from './components/attribute-ratification-card/attribute-ratification-card.component';
import { CanonicalNameAndAliasCardComponent } from './components/canonical-name-and-alias-card/canonical-name-and-alias-card.component';
import { CertificationCardComponent } from './components/certification-card/certification-card.component';
import { ConnectedCertificationDetailsComponent } from './components/connected-certification-details/connected-certification-details.component';
import { ConnectedQualificationDetailsComponent } from './components/connected-qualification-details/connected-qualification-details.component';
import { InstitutionCardComponent } from './components/institution-card/institution-card.component';
import { ManageAliasComponent } from './components/manage-alias/manage-alias.component';
import { QualificationCardComponent } from './components/qualification-card/qualification-card.component';
import { SkillsExportComponent } from './components/skill-export-graph/skill-export-graph.component';
import { SkillsDashboardComponent } from './components/skills-dashboard/skills-dashboard.component';
import { ManageCanonicalNames } from './components/manage-canonical-names/manage-canonical-names.component';
import { UsersWithCertificationForInstitutionComponent } from './components/users-with-certification-for-institution/users-with-certification-for-institution.component';
import { UsersWithQualificationForInstitutionComponent } from './components/users-with-qualification-for-institution/users-with-qualification-for-institution.component';
import { SkillsComponent } from './pages/skills/skills.page';
import { SkillsRoutingModule } from './skills-routing.module';
import { SkillsSearchComponent } from './tabs/search/skills-search.component';
import { CanonicalNameCardComponent } from './components/canonical-name-card/canonical-name-card.component';
import { RatificationActionsComponent } from '../components/ratification-actions/ratification-actions.component';
import { SkillsProfilesComponent } from './components/skills-profiles/skills-profiles.component';

@NgModule({
  declarations: [
    SkillsComponent,

  ],
  imports: [
    CommonModule,
    SkillsRoutingModule,
    SkillsDashboardComponent,
    SharedModule,
    ManageAliasComponent,
    ManageCanonicalNames,
    CanonicalNameAndAliasCardComponent,
    CanonicalNameCardComponent,
    InstitutionCardComponent,
    LoadingIndicatorComponent,
    QualificationCardComponent,
    CertificationCardComponent,
    AttributeRatificationCardComponent,
    SkillsSearchComponent,
    SkillsExportComponent,
    ConnectedQualificationDetailsComponent,
    ConnectedCertificationDetailsComponent,
    UsersWithQualificationForInstitutionComponent,
    UsersWithCertificationForInstitutionComponent,
    RatificationActionsComponent,
    SkillsProfilesComponent
  ]
})
export class SkillsModule { }
