import { Component, ViewChild, Output, EventEmitter } from '@angular/core';
import { EventOrganiserService } from '../../services/event-organisers.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StaffFilterComponent } from '../../components/staff-filter/staff-filter.component';

@Component({
    selector: 'app-add-event-organiser',
    templateUrl: './add-event-organiser.component.html',
    styleUrls: ['./add-event-organiser.component.css'],
    standalone: false
})
export class AddEventOrganiserComponent {
  panelOpenState: boolean;

  @ViewChild(StaffFilterComponent) staffFilterComponent;
  @Output() eventOrganiserAdded = new EventEmitter<boolean>();

  constructor(private eventOrganiserService: EventOrganiserService, private snackbar: MatSnackBar) {}

  handleSelectStaff() {
    this.eventOrganiserService
      .addEventOrganiser(this.staffFilterComponent.selectedUserPrinciple.userPrincipleName)
      .subscribe(
        () => {
          this.snackbar.open('Event organiser added', 'dismiss', {
            duration: 5000,
          });
          this.eventOrganiserAdded.emit(true);
        },
        (error) => {
          this.snackbar.open(error, 'dismiss', {
            duration: 5000,
          });
        }
      );
  }
}
