/** @format */
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "../shared.modules";
import { AttributeRatificationCardComponent } from "./components/attribute-ratification-card/attribute-ratification-card.component";
import { CanonicalNameAndAliasCardComponent } from "./components/canonical-name-and-alias-card/canonical-name-and-alias-card.component";
import { CertificationCardComponent } from "./components/certification-card/certification-card.component";
import { ConnectedCertificationDetailsComponent } from "./components/connected-certification-details/connected-certification-details.component";
import { ConnectedQualificationDetailsComponent } from "./components/connected-qualification-details/connected-qualification-details.component";
import { InstitutionCardComponent } from "./components/institution-card/institution-card.component";
import { ManageAliasComponent } from "./components/manage-alias/manage-alias.component";
import { QualificationCardComponent } from "./components/qualification-card/qualification-card.component";
import { SkillsExportComponent } from "./components/skill-export-graph/skill-export-graph.component";
import { UsersWithCertificationForInstitutionComponent } from "./components/users-with-certification-for-institution/users-with-certification-for-institution.component";
import { UsersWithQualificationForInstitutionComponent } from "./components/users-with-qualification-for-institution/users-with-qualification-for-institution.component";
import { SkillsATCComponent } from "./pages/skills-atc/skills-atc.page";
import { SkillsATCRoutingModule } from "./skills-atc-routing.module";
import { SkillsImportsComponent } from "./tabs/imports/skills-imports.tab";
import { SkillsSearchComponent } from "./tabs/search/skills-search.component";
import { SkillsATCOverviewComponent } from './components/skills-atc-overview/skills-atc-overview.component';
import { RatificationTabComponent } from "./components/ratification-tab/ratification-tab.component";

@NgModule({
  declarations: [SkillsATCComponent, SkillsImportsComponent],
  imports: [
    CommonModule,
    SkillsATCRoutingModule,
    SkillsATCOverviewComponent,
    SharedModule,
    ManageAliasComponent,
    CanonicalNameAndAliasCardComponent,
    InstitutionCardComponent,
    QualificationCardComponent,
    CertificationCardComponent,
    AttributeRatificationCardComponent,
    SkillsSearchComponent,
    SkillsExportComponent,
    ConnectedQualificationDetailsComponent,
    ConnectedCertificationDetailsComponent,
    UsersWithQualificationForInstitutionComponent,
    UsersWithCertificationForInstitutionComponent,
    RatificationTabComponent,
  ],
})
export class SkillsATCModule {}
