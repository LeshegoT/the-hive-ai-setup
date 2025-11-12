import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { EnvironmentService } from '../../../services/environment.service';
import { SharedModule } from '../../../shared.modules';
import { StaffOnSupplyView } from '../../components/staff-on-supply/staff-on-supply.component';


@Component({
    selector: 'app-people-planning',
    templateUrl: './people-planning.page.html',
    imports: [
        CommonModule,
        MatTabsModule,
        StaffOnSupplyView,
        SharedModule,
    ]
})
export class PeoplePlanningComponent {
  constructor(private environmentService: EnvironmentService) {}

}
