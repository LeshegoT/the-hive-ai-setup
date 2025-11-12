import { Component } from '@angular/core';
import { EnvironmentService } from '../../../services/environment.service';


@Component({
    selector: 'app-skills-atc',
    templateUrl: './skills-atc.page.html',
    styleUrls: ['./skills-atc.page.css'],
    standalone: false
})
export class SkillsATCComponent {
  componentClass: string;
  hrDashboardEnabled = false;

  constructor(private environmentService: EnvironmentService) {}

}
