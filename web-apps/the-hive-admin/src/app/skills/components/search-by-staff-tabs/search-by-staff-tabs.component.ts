import { Component, Input } from '@angular/core';
import { StaffAttributesComponent } from '../staff-profile/staff-attributes.component';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { Person } from '../../../shared/interfaces';
import { EnvironmentService } from '../../../services/environment.service';
import { WorkExperienceComponent } from '../work-experience/work-experience.component';
import { SkillsProfilesComponent } from '../skills-profiles/skills-profiles.component';

@Component({
    selector: 'app-search-by-staff-tabs',
    templateUrl: './search-by-staff-tabs.component.html',
    styleUrls: ['./search-by-staff-tabs.component.css'],
    imports: [
      MatTabGroup,
      MatTabsModule,
      StaffAttributesComponent,
      WorkExperienceComponent ,
      SkillsProfilesComponent     
    ]   
})
export class SearchByStaffTabsComponent {
  @Input() selectedStaffMember: Person;
  displaySkillsSearchByStaffTabs = false;

  constructor(private readonly environmentService: EnvironmentService) {
    this.displaySkillsSearchByStaffTabs = this.environmentService.getConfiguratonValues().DISPLAY_SKILLS_SEARCH_BY_STAFF_TABS;
  }
}