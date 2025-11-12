import { Component } from '@angular/core';
import { EnvironmentService } from '../../../services/environment.service';


@Component({
    selector: 'app-skills',
    templateUrl: './skills.page.html',
    styleUrls: ['./skills.page.css'],
    standalone: false
})
export class SkillsComponent {
  componentClass: string;
  hrDashboardEnabled = false;

  constructor(private environmentService: EnvironmentService) {}

}
