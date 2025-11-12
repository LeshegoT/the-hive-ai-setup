import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { EnvironmentService } from '../../../services/environment.service';


@Component({
    selector: 'app-feedback',
    templateUrl: './feedback.page.html',
    styleUrls: ['./feedback.page.css', '../../../shared/shared.css'],
    standalone: false
})
export class FeedbackComponent implements OnInit {
  hrDashboardEnabled = false;
  limitedReviewUsers: string[] = [];
  currentUpn: string;

  constructor(private environmentService: EnvironmentService, private readonly authService: AuthService) {}

  ngOnInit() {
    this.environmentService.getConfig().subscribe((env) => {
      this.hrDashboardEnabled = env.HR_REVIEW_DASHBOARD_ENABLED;
      this.limitedReviewUsers = env.LIMITED_REVIEW_USERS.map((user) => user.trim().toLowerCase());
    });

    this.authService.getUserPrincipleName().subscribe((upn) => this.currentUpn = upn.toLowerCase());
  }
}
