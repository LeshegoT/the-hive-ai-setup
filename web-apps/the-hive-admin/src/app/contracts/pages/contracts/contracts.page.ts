import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { EnvironmentService } from '../../../services/environment.service';

@Component({
    selector: 'app-contracts',
    templateUrl: './contracts.page.html',
    styleUrls: ['./contracts.page.css', '../../../shared/shared.css'],
    standalone: false
})
export class Contracts implements OnInit, OnDestroy {
  componentClass: string;
  hrDashboardEnabled = false;

  constructor(private environmentService: EnvironmentService, private matIconReg: MatIconRegistry) {}

  ngOnInit() {
    this.environmentService.getConfig().subscribe((env) => {
      this.componentClass = env.ENVIRONMENT_NAME;
      this.hrDashboardEnabled = env.CONTRACTS_DASHBOARD_ENABLED;
    });
    
    this.matIconReg.setDefaultFontSetClass('material-symbols-outlined')
  }

  ngOnDestroy(){
    this.matIconReg.setDefaultFontSetClass('material-icons');
  }
}
