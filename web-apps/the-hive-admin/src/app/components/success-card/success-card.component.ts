import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-success-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './success-card.component.html',
  styleUrls: ['./success-card.component.css']
})
export class SuccessCardComponent {
  title = input<string>('Success');
  icon = input<string>('check_circle');
}
