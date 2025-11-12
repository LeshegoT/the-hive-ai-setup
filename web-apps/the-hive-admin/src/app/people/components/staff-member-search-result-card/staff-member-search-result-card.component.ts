import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { Staff } from '@the-hive/lib-staff-shared';
import { ProfileComponent } from '../../../components/profile/profile.component';
import { GraphApiUser } from '../../../services/profile.service';
import { Person } from '../../../shared/interfaces';

@Component({
  selector: 'app-staff-member-search-result-card',
  templateUrl: './staff-member-search-result-card.component.html',
  styleUrls: ['./staff-member-search-result-card.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    ProfileComponent
  ]
})
export class StaffMemberSearchResultCardComponent {
  staffMember = input<GraphApiUser | Staff | Person>();
  upn = computed(() => {
    const member = this.staffMember();
    if (member && 'upn' in member) {
      return member.upn;
    } else if (member && 'userPrincipleName' in member) {
      return member.userPrincipleName;
    } else {
      return undefined;
    }
  });
}
