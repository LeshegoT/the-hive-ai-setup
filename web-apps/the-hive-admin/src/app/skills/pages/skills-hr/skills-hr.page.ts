import { Component } from '@angular/core';
import { EnvironmentService } from '../../../services/environment.service';


@Component({
    selector: 'app-skills-hr',
    templateUrl: './skills-hr.page.html',
    styleUrls: ['./skills-hr.page.css'],
    standalone: false
})
export class SkillsHRComponent {
  componentClass: string;
  displayPendingProofTab = false;

  constructor(private environmentService: EnvironmentService) {
    this.displayPendingProofTab = this.environmentService.getConfiguratonValues().DISPLAY_PENDING_PROOF_VALIDATION_SKILLSHR_TAB
  }

}
