import { Component, Input, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { EnvironmentService } from '../../services/environment.service';
import { config } from 'process';

@Component({
    selector: 'app-title',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
    standalone: false
})
export class HeaderComponent implements OnInit {
  // Title for each page
  @Input() title = '';
  @Input() iconName = '';

  // Get path to icon automatically
  LOGO_PATH = 'assets/images/logos/';


  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private environment: EnvironmentService
  ) {}

  ngOnInit() {
    this.environment.config$.subscribe({
      next: (config) => {
        this.matIconRegistry.addSvgIcon(
          this.iconName,
          this.domSanitizer.bypassSecurityTrustResourceUrl(
            config.ADMIN_REDIRECT_URI + this.LOGO_PATH + this.iconName + '.svg'
          )
        );
      }
    })
  }
}
