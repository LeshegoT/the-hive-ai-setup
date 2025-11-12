import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { UnitCorrectionsPageComponent } from "../../../components/unit-corrections-page/unit-corrections-page";
import { EnvironmentService } from '../../../services/environment.service';
import { SharedModule } from '../../../shared.modules';
import { AllStaffColumn, AllStaffComponent } from '../../components/all-staff/all-staff.component';
import { OffboardingStaffComponent } from '../../components/offboarding/offboarding-staff.component';
import { OnboardingStaffComponent } from '../../components/onboarding/onboarding-staff.component';
import { UnitMovePageComponent } from '../../components/unit-move-page/unit-move-page.component';
import { AuthService } from '../../../services/auth.service';


@Component({
    selector: 'app-people',
    templateUrl: './people.page.html',
    imports: [
        CommonModule,
        MatTabsModule,
        SharedModule,
        AllStaffComponent,
        OnboardingStaffComponent,
        UnitCorrectionsPageComponent,
        UnitMovePageComponent,
        OffboardingStaffComponent
    ]
})
export class PeopleComponent implements OnInit {
  staffTableColumns: AllStaffColumn[] = ['displayName', 'jobTitle', 'userPrincipleName', 'userName', 'department', 'office', 'manager', 'actions'];
  onboardingEnabled = false;
  unitMoveReviewsEnabled = false;
  terminationEnabled = false;
  unitCorrectionsEnabled = false;;
  unitMoveHrReps: string[] = [];
  currentUpn: string;

  constructor(private readonly environmentService: EnvironmentService,private readonly authService: AuthService) {}

  ngOnInit(){
    const configuration = this.environmentService.getConfiguratonValues();
    this.unitCorrectionsEnabled = configuration.UNIT_CORRECTIONS_ENABLED;
    this.onboardingEnabled = configuration.ONBOARDING_ENABLED;
    this.terminationEnabled = configuration.TERMINATION_ENABLED;
    this.unitMoveReviewsEnabled = configuration.UNIT_CHANGE_REVIEWS_ENABLED;
    this.authService.getUserPrincipleName().subscribe((upn) => this.currentUpn = upn.toLowerCase());  
    this.environmentService.getConfig().subscribe((env) => {
      this.unitMoveHrReps = env.UNIT_MOVE_HR_REPS.map((user) => user.trim().toLowerCase());
    });
  }
}
