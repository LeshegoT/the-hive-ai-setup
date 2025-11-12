import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
    selector: 'warning-badge',
    imports: [
        CommonModule,
        MatChipsModule,
        MatIconModule,
        MatBadgeModule
    ],
    templateUrl: './warning-badge.component.html',
    styleUrls: ['./warning-badge.component.css']
})
export class WarningBadgeComponent {
  @Input() total = 0;
  @Input() selected = false;
}